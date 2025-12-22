import User from "../models/userModel.js";
import File from "../models/fileModel.js";
import { deletes3Files } from "../services/s3.js";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";

export const resetUserToDefault = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Delete subscription-only files
    const subscriptionFiles = await File.find({ userId, haveSubscription: true });

    if (subscriptionFiles.length > 0) {
        const s3Keys = subscriptionFiles.map(file => ({ Key: `${file._id}${file.extension}` }));
        await deletes3Files(s3Keys);

        const dirUpdates = {};
        for (const file of subscriptionFiles) {
            const dirId = file.parentDirId.toString();
            dirUpdates[dirId] = (dirUpdates[dirId] || 0) + file.size;
        }

        for (const [dirId, totalSize] of Object.entries(dirUpdates)) {
            await updateDirectorySize(dirId, -totalSize);
        }

        await File.deleteMany({ userId, haveSubscription: true });
    }

    // 2. Reset limits
    user.maxStorageLimit = 524288000;
    user.maxDevices = 1;
    user.maxFileSize = 104857600;
    user.subscriptionId = null;
    await user.save();
};
