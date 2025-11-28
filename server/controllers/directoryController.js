import { rm } from "fs/promises";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import {
  createDirectorySchema,
  deleteDirectorySchema,
  getDirectorySchema,
  renameDirectorySchema,
} from "../validators/directorySchema.js";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";
import { file } from "zod";
import { deletes3Files } from "../services/s3.js";

export const getDirectory = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Please log in first." });
  }
  const _id = req.params.id || user.rootDirId.toString();

  if (!_id) {
    return res
      .status(400)
      .json({ error: "Invalid request. Directory ID not found." });
  }

  const validateResult = getDirectorySchema.safeParse({ id: _id });

  if (!validateResult.success) {
    return res.status(400).json({
      success: false,
      message: validateResult.error.errors[0].message,
    });
  }

  const { id } = validateResult.data;
  const directoryData = await Directory.findOne({
    _id: id,
    userId: req.user._id,
  })
    .populate("path", "name")
    .lean();

  if (!directoryData) {
    return res
      .status(404)
      .json({ error: "Directory not found or you do not have access to it!" });
  }

  const files = await File.find({ parentDirId: directoryData._id }).lean();
  const directories = await Directory.find({ parentDirId: _id }).lean();
  
  // Recursive function to count all nested files and folders
  async function getRecursiveCounts(dirId) {
    const filesInDir = await File.find({ parentDirId: dirId }).lean();
    const subdirsInDir = await Directory.find({ parentDirId: dirId }).lean();
    
    let totalFiles = filesInDir.length;
    let totalFolders = subdirsInDir.length;
    
    // Recursively count in each subdirectory
    for (const subdir of subdirsInDir) {
      const counts = await getRecursiveCounts(subdir._id);
      totalFiles += counts.totalFiles;
      totalFolders += counts.totalFolders;
    }
    
    return { totalFiles, totalFolders };
  }
  
  // Get recursive counts for this directory
  const { totalFiles, totalFolders } = await getRecursiveCounts(directoryData._id);
  
  return res.status(200).json({
    ...directoryData,
    files: files.map((dir) => ({ ...dir, id: dir._id })),
    directories: directories.map((dir) => ({ ...dir, id: dir._id })),
    totalFiles,
    totalFolders,
  });
};

export const createDirectory = async (req, res, next) => {
  const user = req.user;

  const parentDirId = req.params.parentDirId || user.rootDirId.toString();
  const dirname = req.headers.dirname || "New Folder";

  const validateResult = createDirectorySchema.safeParse({
    parentDirId: parentDirId,
    dirname: dirname,
  });

  if (!validateResult.success) {
    return res
      .status(400)
      .json({ error: "Invalid Directory details while creation" });
  }

  try {
    const parentDir = await Directory.findOne({
      _id: parentDirId,
    }).lean();

    if (!parentDir)
      return res
        .status(404)
        .json({ message: "Parent Directory Does not exist!" });

     const newPath = [...(parentDir.path || []), parentDir._id];
     
    await Directory.create({
      name: dirname,
      parentDirId,
      userId: user._id,
      path: newPath,
    });

    return res.status(201).json({ message: "Directory Created!" });
  } catch (err) {
    if (err.code === 121) {
      res
        .status(400)
        .json({ error: "Invalid input, please enter valid details" });
    } else {
      next(err);
    }
  }
};

export const renameDirectory = async (req, res, next) => {
  const user = req.user;

  const validateResult = renameDirectorySchema.safeParse({
    dirId: req.params.id,
    newDirName: req.body.newDirName,
  });

  if (!validateResult.success) {
    return res
      .status(400)
      .json({ error: "Invalid Details of Directory while rename" });
  }

  const { dirId, newDirName } = validateResult.data;

  try {
    await Directory.findOneAndUpdate(
      {
        _id: dirId,
        userId: user._id,
      },
      { name: newDirName }
    );
    res.status(200).json({ message: "Directory Renamed!" });
  } catch (err) {
    next(err);
  }
};

export const deleteDirectory = async (req, res, next) => {
  const validateResult = deleteDirectorySchema.safeParse({
    dirId: req.params.id,
  });

  if (!validateResult.success) {
    return res.status(400).json({ error: "Directory Id not found" });
  }
  const { dirId } = validateResult.data;

  try {
    const directoryData = await Directory.findOne({
      _id: dirId,
      userId: req.user._id,
    }).lean();

    if (!directoryData) {
      return res.status(404).json({ error: "Directory not found!" });
    }

    async function getDirectoryContents(id) {
      let files = await File.find({ parentDirId: id })
        .select("extension")
        .lean();
      let directories = await Directory.find({ parentDirId: id })
        .select("_id")
        .lean();

      for (const { _id } of directories) {
        const { files: childFiles, directories: childDirectories } =
          await getDirectoryContents(_id);

        files = [...files, ...childFiles];
        directories = [...directories, ...childDirectories];
      }

      return { files, directories };
    }

    const { files, directories } = await getDirectoryContents(dirId);

    const keys = files.map(({_id, extension}) => ({Key:`${_id}${extension}`}))

    console.log(keys);

    await deletes3Files(keys);
    await File.deleteMany({
      _id: { $in: files.map(({ _id }) => _id) },
    });

    await Directory.deleteMany({
      _id: { $in: [...directories.map(({ _id }) => _id), dirId] },
    });

    await updateDirectorySize(directoryData.parentDirId, -directoryData.size);
  } catch (err) {
    next(err);
  }
  return res.json({ message: "Files deleted successfully" });
};
