import cron from "node-cron";
import File from "../models/fileModel.js";
import { deletes3File } from "../services/s3.js";

export const cleanupOrphanedUploads = () => {
  // Run every day at 3:00 AM
  cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("🧹 Running orphaned uploads cleanup...");
      const session = await File.startSession();
      try {
        session.startTransaction();

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find orphaned files
        const orphanedFiles = await File.find({
            isUploading: true,
            createdAt: { $lt: twentyFourHoursAgo },
        }).session(session);

        if (orphanedFiles.length === 0) {
            console.log("✅ No orphaned uploads found.");
            await session.commitTransaction();
            return;
        }

        console.log(`Found ${orphanedFiles.length} orphaned files to delete.`);

        for (const file of orphanedFiles) {
             const s3Key = file.extension ? `${file._id}${file.extension}` : `${file._id}.${file.extension}`;
             try {
                await deletes3File(s3Key);
             } catch (s3Err) {
                console.error(`Failed to delete S3 file ${s3Key}:`, s3Err);
             }
             
             await file.deleteOne({ session });
        }

        await session.commitTransaction();
        console.log(`✅ Cleanup complete. Deleted ${orphanedFiles.length} files.`);

      } catch (error) {
        await session.abortTransaction();
        console.error("❌ Error in cleanupOrphanedUploads:", error);
      } finally {
        session.endSession();
      }
    },
    {
      schedule: true,
      timezone: "Asia/Kolkata",
    }
  );
};
