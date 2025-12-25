import mongoose from "mongoose";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import Subscription from "../models/subscriptionModel.js";
import { resolveFilePath } from "../utils/resolveFilePath.js";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";
import { createCloudFrontSignedGetUrl } from "../services/cloudFront.js";
import { deleteFileSchema, getFileSchema, renameFileSchema } from "../validators/fileSchema.js";
import { completeUploadCheck, createUploadSignedUrl, deletes3File, getFileUrl, } from "../services/s3.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validateWithSchema } from "../utils/validationWrapper.js";
import { runInTransaction } from "../utils/transactionHelper.js";

export const getFile = async (req, res) => {
  const { success, data } = validateWithSchema(getFileSchema, { fileId: req.params.id });

  if (!success) {
    return errorResponse(res, "invalid File Id", 400);
  }

  const { fileId } = data;

  const fileData = await File.findOne({
    _id: fileId,
  });

  // Check if file exists
  if (!fileData) {
    return errorResponse(res, "File not found!", 404);
  }

  const s3Key = `${fileId}${fileData.extension}`;

  const isDownload = req.query.action === "download";
  let getUrl;

  if (isDownload) {
    getUrl = await getFileUrl({
      Key: s3Key,
      download: true,
      filename: fileData.name,
    });
  } else {
    getUrl = createCloudFrontSignedGetUrl({
      key: s3Key,
      filename: fileData.name,
    });
  }

  if (req.query.json === "true") {
    return successResponse(res, { url: getUrl });
  }

  return res.redirect(getUrl);
};

export const renameFile = async (req, res, next) => {
  const { success, data } = validateWithSchema(renameFileSchema, {
    fileId: req.params.id,
    newFilename: req.body.newFilename,
    userId: req.user._id.toString(),
    version: req.body.version,
  });

  if (!success) {
    return errorResponse(res, "Invalid Id's", 400);
  }
  const { fileId, newFilename, userId, version } = data;

  // Find the file 
  const file = await File.findById(fileId);

  // Check if file exists
  if (!file) {
    return errorResponse(res, "File not found!", 404);
  }
  // Optimistic locking check
  if (version !== undefined && file.__v !== version) {
    return errorResponse(res, "File has been modified by another user. Please refresh.", 409);
  }

  file.__v = (file.__v || 0) + 1;
  // Check if this is a share link request (token in query or header)
  const shareToken = req.query.shareToken || req.headers['x-share-token'];

  if (shareToken) {
    // Validate share link token and permissions
    if (!file.shareLink ||
      file.shareLink.token !== shareToken ||
      !file.shareLink.enabled) {
      return errorResponse(res, "Invalid or disabled share link", 403);
    }

    if (file.shareLink.role !== "editor") {
      return errorResponse(res, "Share link does not have editor permissions", 403);
    }
    // Share link is valid with editor permissions, allow rename
  } else {
    // Regular request - check if user is owner OR has editor permission
    const isOwner = file.userId.toString() === userId;
    const hasEditorAccess = file.sharedWith.some(
      (share) => share.userId.toString() === userId && share.role === "editor"
    );

    if (!isOwner && !hasEditorAccess) {
      return errorResponse(res, "You don't have permission to rename this file", 403);
    }
  }

  try {
    file.name = newFilename;
    await file.save();
    return successResponse(res, null, "Renamed");
  } catch (err) {
    console.log(err);
    err.status = 500;
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  const { success, data } = validateWithSchema(deleteFileSchema, {
    fileId: req.params.id,
    userId: req.user._id.toString(),
  });

  if (!success) {
    return errorResponse(res, "Invalid Id's", 400);
  }

  const { fileId, userId } = data;

  const file = await File.findOne({
    _id: fileId,
    userId: userId,
  });

  if (!file) {
    return errorResponse(res, "File not found!", 404);
  }

  try {
    await file.deleteOne();
    await updateDirectorySize(file.parentDirId, -file.size);
    await deletes3File(`${file.id}${file.extension}`);
    return successResponse(res, null, "File Deleted Successfully");
  } catch (err) {
    next(err);
  }
};

export const getFileDetails = async (req, res, next) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    return errorResponse(res, "File not found", 404);
  }

  // Verify ownership or shared access
  const isOwner = file.userId.toString() === req.user._id.toString();
  const isShared = file.sharedWith.some(
    (s) => s.userId.toString() === req.user._id.toString()
  );

  if (!isOwner && !isShared) {
    return errorResponse(res, "Access denied", 403);
  }

  const result = await resolveFilePath(req.params.id);
  if (!result) {
    return errorResponse(res, "Error resolving path", 404);
  }
  return successResponse(res, result);
};

export const uploadFileInitiate = async (req, res, next) => {
  const { name, size, contentType, parentDirId } = req.body;

  if (!name || size <= 0 || !contentType) {
    return errorResponse(res, "to upload file req body need specified info", 400);
  }

  try {
    const result = await runInTransaction(async (session) => {
      const actualParentDirId = parentDirId || req.user.rootDirId;
      const parentDir = await Directory.findById(actualParentDirId).session(session);

      if (!parentDir) {
        throw { statusCode: 400, message: "Parent directory not found" };
      }

      // parent directory belongs to user
      if (parentDir.userId.toString() !== req.user._id.toString()) {
        throw { statusCode: 403, message: "You don't have access to this directory" };
      }

      const rootDir = await Directory.findById(req.user.rootDirId).session(session);
      const fullUser = await User.findById(req.user._id).session(session);

      const availableSpace = fullUser.maxStorageLimit - rootDir.size;

      if (size > availableSpace) {
        throw { statusCode: 413, message: "Storage quota exceeded. Please delete some files or upgrade your plan." };
      }

      if (size > fullUser.maxFileSize) {
        throw { statusCode: 413, message: `File size exceeds the maximum limit of ${fullUser.maxFileSize / 1024 / 1024} MB for your current plan.` };
      }

      const extension = name.includes(".")
        ? name.substring(name.lastIndexOf("."))
        : "";

      const haveSubscription = !!fullUser.subscriptionId;

      // Create file with session
      const [newFile] = await File.create([{
        name,
        size,
        contentType,
        extension,
        userId: fullUser._id,
        parentDirId: actualParentDirId,
        isUploading: true,
        haveSubscription,
      }], { session });

      return newFile;
    });

    const s3Key = `${result._id}${result.extension}`;

    const signedUrl = await createUploadSignedUrl({
      key: s3Key,
      contentType: contentType,
    });

    return successResponse(res, { fileId: result._id, uploadUrl: signedUrl });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    throw error;
  }
};

export const completeFileUpload = async (req, res, next) => {
  const { fileId } = req.body;

  const file = await File.findById(fileId);

  if (!file) {
    return errorResponse(res, "File not found", 404);
  }

  // Verify ownership
  if (file.userId.toString() !== req.user._id.toString()) {
    return errorResponse(res, "You don't have access to this file", 403);
  }

  const fullFileName = file.extension.startsWith(".")
    ? `${file._id}${file.extension}`
    : `${file._id}.${file.extension}`;

  try {
    const resultFileSize = await completeUploadCheck({
      filename: fullFileName,
    });

    if (file.size !== resultFileSize) {
      return errorResponse(res, "File sizes don't match", 412, { expected: file.size, actual: resultFileSize });
    }

    file.isUploading = false;
    await file.save();

    await updateDirectorySize(file.parentDirId, file.size);

    return successResponse(res, { size: resultFileSize });
  } catch (err) {
    console.log(err);
    return errorResponse(res, "Failed to verify file", 500);
  }
};

export const cancelFileUpload = async (req, res, next) => {
  const { fileId } = req.body;

  if (!fileId) {
    return errorResponse(res, "File ID is required", 400);
  }

  try {
    const file = await File.findById(fileId);

    if (!file) {
      return errorResponse(res, "File not found", 404);
    }

    // Verify ownership
    if (file.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, "You don't have access to this file", 403);
    }

    // Delete from S3
    const s3Key = `${file._id}${file.extension}`;
    await deletes3File(s3Key);

    if (!file.isUploading) {
      await updateDirectorySize(file.parentDirId, -file.size);
    }

    await file.deleteOne();

    return successResponse(res, null, "Upload cancelled successfully");
  } catch (err) {
    console.error("Error cancelling upload:", err);
    return errorResponse(res, "Failed to cancel upload", 500);
  }
};
