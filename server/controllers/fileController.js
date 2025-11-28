import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";

import { updateDirectorySize } from "../utils/updateDirectorySize.js";

import {
  deleteFileSchema,
  getFileSchema,
  renameFileSchema,
} from "../validators/fileSchema.js";
import { resolveFilePath } from "../utils/resolveFilePath.js";
import {
  completeUploadCheck,
  createUploadSignedUrl,
  getFileUrl,
} from "../utils/s3.js";


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
    userId: req.user._id,
  }).lean();

  // Check if file exists
  if (!fileData) {
    return res.status(404).json({ error: "File not found!" });
  }

  const filePath = `${process.cwd()}/storage/${fileId}${fileData.extension}`;

  const s3Key = `${fileId}${fileData.extension}`;

  if (req.query.action === "download") {
    const getUrl = await getFileUrl({
      Key: s3Key,
      download: true,
      filename: fileData.name,
    });
    return res.redirect(getUrl);
  }

  const getUrl = await getFileUrl({
    Key: s3Key,
    filename: fileData.name,
  });

  return res.redirect(getUrl);
};

export const renameFile = async (req, res, next) => {
  const validateData = renameFileSchema.safeParse({
    fileId: req.params.id,
    newFilename: req.body.newFilename,
    userId: req.user._id.toString(),
  });
  if (!validateData.success) {
    return res.status(400).json({ error: "Invalid Id's" });
  }
  const { fileId, newFilename, userId } = validateData.data;

  // const { id } = req.params;
  const file = await File.findOne({
    _id: fileId,
    userId: userId,
  });

  // Check if file exists
  if (!file) {
    return res.status(404).json({ error: "File not found!" });
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
    await rm(`${import.meta.dirname}/../storage/${fileId}${file.extension}`);
    return res.status(200).json({ message: "File Deleted Successfully" });
  } catch (err) {
    next(err);
  }
};

export const getFileDetails = async (req, res, next) => {
  const result = await resolveFilePath(req.params.id);
  console.log(result);
  if (!result) {
    return res.status(404).json({ message: "File not found" });
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

  const actualParentDirId = parentDirId || req.user.rootDirId;
  const parentDir = await Directory.findById(actualParentDirId);

  if (!parentDir) {
    return res.status(400).json({ error: "Parent directory not found" });
  }

  // parent directory belongs to user
  if (parentDir.userId.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ error: "You don't have access to this directory" });
  }

  const rootDir = await Directory.findById(req.user.rootDirId);

  const fullUser = await User.findById(req.user._id);

  const availableSpace = fullUser.maxStorageLimit - rootDir.size;

  if (size > availableSpace) {
    return res.status(413).json({
      error:
        "Storage quota exceeded. Please delete some files or upgrade your plan.",
    });
  }

  const extension = name.includes(".")
    ? name.substring(name.lastIndexOf("."))
    : "";

  const newFile = await File.insertOne({
    name,
    size,
    contentType,
    extension,
    userId: fullUser._id,
    parentDirId: actualParentDirId,
    isUploading: true,
  });

  const s3Key = `${newFile._id}${extension}`;

  const signedUrl = await createUploadSignedUrl({
    key: s3Key,
    contentType: contentType,
  });

  return res.status(200).json({ fileId: newFile._id, uploadUrl: signedUrl });
};

export const completeFileUpload = async (req, res, next) => {
  const { fileId } = req.body;

  const file = await File.findById(fileId);

  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }

  // ADD THIS: Verify ownership
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

    const user = await User.findById(file.userId);
    const rootDir = await Directory.findById(user.rootDirId);

    await updateDirectorySize(rootDir, file.size);

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
