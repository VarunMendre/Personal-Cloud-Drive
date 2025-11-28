import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";

import {
  deleteFileSchema,
  getFileSchema,
  renameFileSchema,
} from "../validators/fileSchema.js";
import { resolveFilePath } from "../utils/resolveFilePath.js";

export const uploadFile = async (req, res, next) => {
  const parentDirId = req.params.parentDirId || req.user.rootDirId;
  try {
    const parentDirData = await Directory.findOne({
      _id: parentDirId,
      userId: req.user._id,
    });

    // Check if parent directory exists
    if (!parentDirData) {
      return res.status(404).json({ error: "Parent directory not found!" });
    }

    const filename = req.headers.filename || "untitled";
    const filesize = Number(req.headers.filesize);

    const user = await User.findById(req.user._id);
    const rootDir = await Directory.findById(req.user.rootDirId);

    const remainingSpace = user.maxStorageLimit - rootDir.size;

    if (filesize > remainingSpace) {
      console.log("File is too Large");
      return res.destroy();
    }

    const extension = path.extname(filename);

    const insertedFile = await File.insertOne({
      extension,
      name: filename,
      size: filesize,
      parentDirId: parentDirData._id,
      userId: req.user._id,
    });

    const fileId = insertedFile.id;

    const fullFileName = `${fileId}${extension}`;
    const filePath = `${import.meta.dirname}/../storage/${fullFileName}`;

    const writeStream = createWriteStream(filePath);

    let totalStreamSize = 0;
    let aborted = false;
    req.on("data", async (chunk) => {
      if (aborted) return;
      totalStreamSize += chunk.length;
      if (totalStreamSize > filesize) {
        aborted = true;
        writeStream.close();
        await rm(filePath);
        await insertedFile.deleteOne();
        return req.socket.destroy();
      }
      writeStream.write(chunk);
    });

    let fileUploadCompleted = false;
    req.on("end", async () => {
      fileUploadCompleted = true;
      await updateDirectorySize(parentDirId, totalStreamSize);
      return res.status(201).json({ message: "File Uploaded" });
    });

    req.on("close", async () => {
      if (!fileUploadCompleted) {
        try {
          await insertedFile.deleteOne();
          await rm(filePath);
          console.log("file cleaned");
        } catch (err) {
          console.log("Error to cleaning up upload abort: ", err);
        }
      }
    });

    req.on("error", async () => {
      await File.deleteOne({ _id: insertedFile.insertedId });
      return res.status(404).json({ message: "Could not Upload File" });
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

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

  // If "download" is requested, set the appropriate headers
  const filePath = `${process.cwd()}/storage/${fileId}${fileData.extension}`;

  if (req.query.action === "download") {
    return res.download(filePath, fileData.name);
  }

  // Send file
  return res.sendFile(filePath, (err) => {
    if (!res.headersSent && err) {
      return res.status(404).json({ error: "File not found!" });
    }
  });
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

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

  // const s3Client = new S3Client({
  //   profile: process.env.AWS_PROFILE,
  // });

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
    signableHeaders: new Set(["content-type"]),
  });

  return res.status(200).json({ fileId: newFile._id, uploadUrl: url });
};

export const completeFileUpload = async (req, res, next) => {
  const { fileId } = req.body;

  const file = await File.findById(fileId);

  const fullFileName = file.extension.startsWith(".")
    ? `${file._id}${file.extension}`
    : `${file._id}.${file.extension}`;

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: fullFileName, // This will only return files starting with this name
      MaxKeys: 1,
    });

    const result = await s3Client.send(command);

    const resultFile = result.Contents[0].Size;

    if (file.size !== resultFile) {
      return res.status(412).json({ error: "File Sizes doesn't matched" });
    }

    file.isUploading = false;
    await file.save();

    const user = await User.findById(file.userId);
    const rootDir = await Directory.findById(user.rootDirId);

    await updateDirectorySize(rootDir, file.size);

    return res.status(200).json({
      success: true,
      size: result.ContentLength,
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
