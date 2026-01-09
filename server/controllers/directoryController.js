import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import {
  createDirectorySchema,
  deleteDirectorySchema,
  getDirectorySchema,
  renameDirectorySchema,
} from "../validators/directorySchema.js";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";
import { deletes3Files } from "../services/s3.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validateWithSchema } from "../utils/validationWrapper.js";

export const getDirectory = async (req, res) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, "Unauthorized. Please log in first.", 401);
  }
  const _id = req.params.id || user.rootDirId.toString();

  const { success, data, error } = validateWithSchema(getDirectorySchema, { id: _id });

  if (!success) {
    return errorResponse(res, error, 400);
  }

  const { id } = data;
  const directoryData = await Directory.findOne({
    _id: id,
    userId: req.user._id,
  })
    .populate("path", "name")
    .lean();

  if (!directoryData) {
    return errorResponse(res, "Directory not found or you do not have access to it!", 404);
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
  
  return successResponse(res, {
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

  const { success, data } = validateWithSchema(createDirectorySchema, {
    parentDirId: parentDirId,
    dirname: dirname,
  });

  if (!success) {
    return errorResponse(res, "Invalid Directory details while creation", 400);
  }

  try {
    const parentDir = await Directory.findOne({
      _id: parentDirId,
    }).lean();

    if (!parentDir)
      return errorResponse(res, "Parent Directory Does not exist!", 404);

     const newPath = [...(parentDir.path || []), parentDir._id];
     
    await Directory.create({
      name: dirname,
      parentDirId,
      userId: user._id,
      path: newPath,
    });

    return successResponse(res, null, "Directory Created!", 201);
  } catch (err) {
    if (err.code === 121) {
      return errorResponse(res, "Invalid input, please enter valid details", 400);
    } else {
      next(err);
    }
  }
};

export const renameDirectory = async (req, res, next) => {
  const user = req.user;

  const { success, data } = validateWithSchema(renameDirectorySchema, {
    dirId: req.params.id,
    newDirName: req.body.newDirName,
  });

  if (!success) {
    return errorResponse(res, "Invalid Details of Directory while rename", 400);
  }

  const { dirId, newDirName } = data;

  try {
    await Directory.findOneAndUpdate(
      {
        _id: dirId,
        userId: user._id,
      },
      { name: newDirName }
    );
    return successResponse(res, null, "Directory Renamed!");
  } catch (err) {
    next(err);
  }
};

export const deleteDirectory = async (req, res, next) => {
  const { success, data } = validateWithSchema(deleteDirectorySchema, {
    dirId: req.params.id,
  });

  if (!success) {
    return errorResponse(res, "Directory Id not found", 400);
  }
  const { dirId } = data;

  try {
    const directoryData = await Directory.findOne({
      _id: dirId,
      userId: req.user._id,
    }).lean();

    if (!directoryData) {
      return errorResponse(res, "Directory not found!", 404);
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
    
    return successResponse(res, null, "Files deleted successfully");
  } catch (err) {
    next(err);
  }
};
