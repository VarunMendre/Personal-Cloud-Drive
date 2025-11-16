import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import { deleteFileSchema, getFileSchema, renameFileSchema } from "../validators/fileSchema.js";
import { type } from "os";

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

    const uploadingLimit = 100 * 1024 * 1024 // 100 mb
    if(filesize > uploadingLimit) {
      return res.status(413).json({ error: "File much be under 100MB" });
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

    const writeStream = createWriteStream(`${import.meta.dirname}/../storage/${fullFileName}`);
    req.pipe(writeStream);

    req.on("end", async () => {
      return res.status(201).json({ message: "File Uploaded" });
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
    return res.status(400).json({error: "Invalid Id's"})
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
  }).select("extension");

  if (!file) {
    return res.status(404).json({ error: "File not found!" });
  }

  try {
    await rm(`${import.meta.dirname}/../storage/${fileId}${file.extension}`);
    await file.deleteOne();
    return res.status(200).json({ message: "File Deleted Successfully" });
  } catch (err) {
    next(err);
  }
};
