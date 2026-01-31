import express from "express";
import { google } from "googleapis";
import { PassThrough } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../services/s3.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";
import checkAuth, {
  checkUploadAccess,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/google-drive",
  checkAuth,
  checkUploadAccess,
  async (req, res) => {
    try {
      const { fileId, accessToken, parentDirId } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.user._id;

      if (!fileId || !accessToken) {
        return res.status(400).json({ error: "Missing fileId or accessToken" });
      }

      // Validate access token format
      if (typeof accessToken !== "string" || accessToken.length < 10) {
        return res.status(400).json({ error: "Invalid access token format" });
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // 1. Get file metadata
      const meta = await drive.files.get({
        fileId,
        fields: "id, name, mimeType, size",
      });

      const originalName = meta.data.name;
      const mimeType = meta.data.mimeType;
      let fileSize = meta.data.size ? parseInt(meta.data.size) : 0;

      let driveStream;
      let contentType = mimeType;
      let extension = originalName.split(".").pop();
      let finalFilename = originalName;

      // 2. Handle Google Docs vs Binary Files
      if (mimeType.startsWith("application/vnd.google-apps.")) {
        // It's a Google Doc, we need to export it
        let exportMimeType;
        if (mimeType === "application/vnd.google-apps.document") {
          exportMimeType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          extension = "docx";
          contentType = exportMimeType;
        } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
          exportMimeType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          extension = "xlsx";
          contentType = exportMimeType;
        } else if (mimeType === "application/vnd.google-apps.presentation") {
          exportMimeType =
            "application/vnd.openxmlformats-officedocument.presentationml.presentation";
          extension = "pptx";
          contentType = exportMimeType;
        } else {
          // Default to PDF for other types if needed, or PDF for all
          exportMimeType = "application/pdf";
          extension = "pdf";
          contentType = "application/pdf";
        }

        finalFilename = `${originalName}.${extension}`;

        const response = await drive.files.export(
          { fileId, mimeType: exportMimeType },
          { responseType: "stream" }
        );
        driveStream = response.data;
      } else {
        // Binary file
        const response = await drive.files.get(
          { fileId, alt: "media" },
          { responseType: "stream" }
        );
        driveStream = response.data;
      }

      // 3. Prepare File Object (to get ID for S3 Key)
      // Ensure extension has dot if it exists
      if (extension && !extension.startsWith(".")) {
        extension = "." + extension;
      }

      const user = await User.findById(userId);

      if (fileSize > user.maxFileSize) {
        return res.status(413).json({
          error: `File size exceeds the maximum limit of ${user.maxFileSize / 1024 / 1024} MB for your current plan.`,
        });
      }

      const haveSubscription = user.subscriptionId ? true : false;
      const newFile = new File({
        name: finalFilename,
        size: fileSize || 0,
        extension: extension,
        userId: userId,
        parentDirId: parentDirId || req.user.rootDirId,
        isUploading: true, // Set true initially
        haveSubscription,
      });

      // 4. Create S3 Key matching existing system pattern: fileId + extension
      const key = `${newFile._id}${extension}`;

      // 5. Upload to S3
      const parallelUploads3 = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.BUCKET_NAME,
          Key: key,
          Body: driveStream,
          ContentType: contentType,
        },
      });

      parallelUploads3.on("httpUploadProgress", (progress) => {
        // console.log(progress);
      });

      await parallelUploads3.done();

      // 6. Finalize File Record
      // If we didn't have size (exported doc), we might want to update it now if possible,
      // but for now we'll stick with what we have or 0.
      // Ideally we should headObject to get real size if 0.

      newFile.isUploading = false;
      await newFile.save();

      // 7. Update Directory Size
      if (newFile.parentDirId) {
        await updateDirectorySize(newFile.parentDirId, newFile.size);
      }

      res.status(200).json({ success: true, file: newFile });
    } catch (error) {
      // Provide more specific error messages
      let errorMessage = "Failed to import file from Google Drive";
      let statusCode = 500;

      if (
        error.code === 401 ||
        error.message?.includes("invalid_grant") ||
        error.message?.includes("Invalid Credentials")
      ) {
        errorMessage =
          "Invalid or expired Google Drive access token. Please try authenticating again.";
        statusCode = 401;
      } else if (
        error.code === 403 ||
        error.message?.includes("insufficient permissions")
      ) {
        errorMessage =
          "Insufficient permissions to access this file. Please grant the required permissions.";
        statusCode = 403;
      } else if (
        error.code === 404 ||
        error.message?.includes("File not found")
      ) {
        errorMessage =
          "File not found in Google Drive. It may have been deleted or you don't have access.";
        statusCode = 404;
      } else if (error.message?.includes("quota")) {
        errorMessage =
          "Google Drive API quota exceeded. Please try again later.";
        statusCode = 429;
      }
      res
        .status(statusCode)
        .json({ error: errorMessage, details: error.message });
    }
  }
);

export default router;
