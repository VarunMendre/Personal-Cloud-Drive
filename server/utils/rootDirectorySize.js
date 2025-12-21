import Directory from "../models/directoryModel.js";

// Root directory size

export const getRootDirectorySize = async (userId) => {
    const rootDir = await Directory.findOne({ userId, parentDirId: null });
    if (!rootDir) return 0;
    return rootDir.size;
};
