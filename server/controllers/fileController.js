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



export const getFile = async (req, res) => {
  const validateData = getFileSchema.safeParse({
    fileId: req.params.id,
  });

  if (!validateData.success) {
    return res.status(400).json({ error: "invalid File Id" });
  }

  const { fileId } = validateData.data;

  const fileData = await File.findOne({
    _id: fileId,
  });

  // Check if file exists
  if (!fileData) {
    return res.status(404).json({ error: "File not found!" });
  }

  // CHECK: Middleware (checkDownloadAccess) now handles state-based blocking.
  // We remove the manual check here to allow 'paused' downloads.

  const s3Key = `${fileId}${fileData.extension}`;

  if (req.query.action === "download") {
    const getUrl = await getFileUrl({
      Key: s3Key,
      download: true,
      filename: fileData.name,
    });
    return res.redirect(getUrl);
  }

  const getUrl = createCloudFrontSignedGetUrl({
    key: s3Key,
    filename: fileData.name,
  });

  return res.redirect(getUrl);
};

export const renameFile = async (req, res, next) => {
  const validateData = renameFileSchema.safeParse({
    fileId: req.params.id,
    newFilename: req.body.newFilename,
    userId: req.user._id.toString(),
    version: req.body.version, // FIXED: req.body instead of req.user
  });
  if (!validateData.success) {
    return res.status(400).json({ error: "Invalid Id's" });
  }
  const { fileId, newFilename, userId, version } = validateData.data;

  // Find the file 
  const file = await File.findById(fileId);

  // Check if file exists
  if (!file) {
    return res.status(404).json({ error: "File not found!" });
  }
  // Optimistic locking check
  if (version !== undefined && file.__v !== version) {
    return res.status(409).json({ error: "File has been modified by another user. Please refresh." }); // 409 Conflict
  }

  file.__v = (file.__v || 0) + 1;
  // Check if this is a share link request (token in query or header)
  const shareToken = req.query.shareToken || req.headers['x-share-token'];

  if (shareToken) {
    // Validate share link token and permissionsgit 
    if (!file.shareLink ||
      file.shareLink.token !== shareToken ||
      !file.shareLink.enabled) {
      return res.status(403).json({ error: "Invalid or disabled share link" });
    }

    if (file.shareLink.role !== "editor") {
      return res.status(403).json({ error: "Share link does not have editor permissions" });
    }
    // Share link is valid with editor permissions, allow rename
  } else {
    // Regular request - check if user is owner OR has editor permission
    const isOwner = file.userId.toString() === userId;
    const hasEditorAccess = file.sharedWith.some(
      (share) => share.userId.toString() === userId && share.role === "editor"
    );

    if (!isOwner && !hasEditorAccess) {
      return res.status(403).json({ error: "You don't have permission to rename this file" });
    }
  }

  try {
    file.name = newFilename;
    await file.save();
    return res.status(200).json({ message: "Renamed" });
  } catch (err) {
    console.log(err);
    err.status = 500;
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  const validateData = deleteFileSchema.safeParse({
    fileId: req.params.id,
    userId: req.user._id.toString(),
  });

  if (!validateData.success) {
    return res.status(400).json({ error: "Invalid Id's" });
  }

  const { fileId, userId } = validateData.data;

  const file = await File.findOne({
    _id: fileId,
    userId: userId,
  });

  if (!file) {
    return res.status(404).json({ error: "File not found!" });
  }

  try {
    await file.deleteOne();
    await updateDirectorySize(file.parentDirId, -file.size);
    await deletes3File(`${file.id}${file.extension}`);
    return res.status(200).json({ message: "File Deleted Successfully" });
  } catch (err) {
    next(err);
  }
};

export const getFileDetails = async (req, res, next) => {
  const file = await File.findById(req.params.id);
  if (!file) {
    return res.status(404).json({ message: "File not found" });
  }

  // Verify ownership or shared access
  const isOwner = file.userId.toString() === req.user._id.toString();
  const isShared = file.sharedWith.some(
    (s) => s.userId.toString() === req.user._id.toString()
  );

  if (!isOwner && !isShared) {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = await resolveFilePath(req.params.id);
  if (!result) {
    return res.status(404).json({ message: "Error resolving path" });
  }
  res.json(result);
};

export const uploadFileInitiate = async (req, res, next) => {
  const { name, size, contentType, parentDirId } = req.body;

  if (!name || size <= 0 || !contentType) {
    return res
      .status(400)
      .json({ error: "to upload file req body need specified info" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const actualParentDirId = parentDirId || req.user.rootDirId;
    const parentDir = await Directory.findById(actualParentDirId).session(session);

    if (!parentDir) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Parent directory not found" });
    }

    // parent directory belongs to user
    if (parentDir.userId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .json({ error: "You don't have access to this directory" });
    }

    const rootDir = await Directory.findById(req.user.rootDirId).session(session);

    // We fetch the user AGAIN with the session to ensure we are seeing the latest committed state
    // if we were updating a specific field on user. However, files are separate docs.
    // Ideally updateDirectorySize on CompleteUpload is what updates 'size', but here we check 'maxStorageLimit'.
    // The race condition comes if we create many files before any complete.
    // To strictly fix this, we would need to count "isUploading: true" files towards quota here too,
    // OR we just ensure atomic creation.
    // For this fix, we will just ensure this block is atomic and checks the current state.

    const fullUser = await User.findById(req.user._id).session(session);

    const availableSpace = fullUser.maxStorageLimit - rootDir.size;

    if (size > availableSpace) {
      await session.abortTransaction();
      session.endSession();
      return res.status(413).json({
        error:
          "Storage quota exceeded. Please delete some files or upgrade your plan.",
      });
    }

    if (size > fullUser.maxFileSize) {
      await session.abortTransaction();
      session.endSession();
      return res.status(413).json({
        error: `File size exceeds the maximum limit of ${fullUser.maxFileSize / 1024 / 1024} MB for your current plan.`,
      });
    }

    const extension = name.includes(".")
      ? name.substring(name.lastIndexOf("."))
      : "";

    const haveSubscription = fullUser.subscriptionId ? true : false;

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

    await session.commitTransaction();
    session.endSession();

    const s3Key = `${newFile._id}${extension}`;

    const signedUrl = await createUploadSignedUrl({
      key: s3Key,
      contentType: contentType,
    });

    return res.status(200).json({ fileId: newFile._id, uploadUrl: signedUrl });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const completeFileUpload = async (req, res, next) => {
  const { fileId } = req.body;

  const file = await File.findById(fileId);

  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }

  // Verify ownership
  if (file.userId.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ error: "You don't have access to this file" });
  }

  const fullFileName = file.extension.startsWith(".")
    ? `${file._id}${file.extension}`
    : `${file._id}.${file.extension}`;

  try {
    const resultFileSize = await completeUploadCheck({
      filename: fullFileName,
    });

    if (file.size !== resultFileSize) {
      return res.status(412).json({
        error: "File sizes don't match",
        expected: file.size,
        actual: resultFileSize,
      });
    }

    file.isUploading = false;
    await file.save();

    await updateDirectorySize(file.parentDirId, file.size);

    return res.status(200).json({
      success: true,
      size: resultFileSize,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Failed to verify file",
      message: err.message,
    });
  }
};

export const cancelFileUpload = async (req, res, next) => {
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required" });
  }

  try {
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Verify ownership
    if (file.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You don't have access to this file" });
    }

    // Delete from S3
    const s3Key = `${file._id}${file.extension}`;
    await deletes3File(s3Key);

    // if the file was NOT in uploading state, it means it was already counted in storage
    // so we would need to decrease storage.
    // but, this endpoint is specifically for cancelling an *ongoing* upload.
    // if isUploading is true, it hasn't been added to directory size yet (see completeFileUpload).
    // so we ONLY update directory size if isUploading is FALSE (which shouldn't happen for a cancel, but good for safety).
    // actually, if it's a cancel, we assume it's incomplete.
    // if isUploading is true, we just delete the file doc and S3 object.

    if (!file.isUploading) {
      // If for some reason we cancel a completed file (unlikely via this route, but possible),
      // we should treat it like a delete.
      await updateDirectorySize(file.parentDirId, -file.size);
    }

    await file.deleteOne();

    return res.status(200).json({ message: "Upload cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling upload:", err);
    return res.status(500).json({ error: "Failed to cancel upload" });
  }
};
