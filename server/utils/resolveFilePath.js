import File from "../models/fileModel.js";
import Directory from "../models/directoryModel.js";

export async function resolveFilePath(fileId) {
  const file = await File.findById(fileId).lean();

  if (!file) return null;

  const parentDir = await Directory.findById(file.parentDirId).lean();
  if (!parentDir) return null;

  const pathDirs = await Directory.find({
    _id: { $in: parentDir.path },
  }).lean();

  const orderedPath = parentDir.path.map((id) =>
    pathDirs.find((d) => d._id.toString() === id.toString())
  );

  orderedPath.push(parentDir);

  return {
    file,
    path: orderedPath,
  };
}