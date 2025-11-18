import directoryModel from "../models/directoryModel.js";

export async function updateDirectorySize(parentId, deltaSize) {
  while (parentId) {
    const dir = await directoryModel.findById(parentId);
    dir.size += deltaSize;
    await dir.save();
    parentId = dir.parentDirId;
  }
}