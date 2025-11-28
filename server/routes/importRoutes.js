import express from "express";
import { google } from "googleapis";
import { PassThrough } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "../services/s3.js";
import File from "../models/fileModel.js";
import User from "../models/userModel.js";
import { updateDirectorySize } from "../utils/updateDirectorySize.js";

const router = express.Router();

router.post("/google-drive", async (req, res) => {
  console.log("Received Google Drive import request");
  try {
    const { fileId, accessToken, parentDirId } = req.body;
    console.log("Request body:", { fileId, hasAccessToken: !!accessToken, parentDirId });
    
    if (!req.user) {
      console.error("req.user is missing!");
      return res.status(401).json({ error: "User not authenticated" });
    }
    const userId = req.user._id;
    console.log("User ID:", userId);

    if (!fileId || !accessToken) {
      return res.status(400).json({ error: "Missing fileId or accessToken" });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. Get file metadata
    console.log("Fetching file metadata for:", fileId);
    const meta = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size",
    });
    console.log("File metadata:", meta.data);

    const originalName = meta.data.name;
    const mimeType = meta.data.mimeType;
    let fileSize = meta.data.size ? parseInt(meta.data.size) : 0;

    let driveStream;
    let contentType = mimeType;
    let extension = originalName.split(".").pop();
    let finalFilename = originalName;

    // 2. Handle Google Docs vs Binary Files
    if (mimeType.startsWith("application/vnd.google-apps.")) {
      console.log("Handling Google Doc export");
      // It's a Google Doc, we need to export it
      let exportMimeType;
      if (mimeType === "application/vnd.google-apps.document") {
        exportMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        extension = "docx";
        contentType = exportMimeType;
      } else if (mimeType === "application/vnd.google-apps.spreadsheet") {
        exportMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        extension = "xlsx";
        contentType = exportMimeType;
      } else if (mimeType === "application/vnd.google-apps.presentation") {
        exportMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
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
      console.log("Handling binary file download");
      // Binary file
      const response = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );
      driveStream = response.data;
    }

    console.log("Stream obtained. Preparing S3 upload...");

    // 3. Prepare File Object (to get ID for S3 Key)
    // Ensure extension has dot if it exists
    if (extension && !extension.startsWith(".")) {
      extension = "." + extension;
    }
    
    const newFile = new File({
      name: finalFilename,
      size: fileSize || 0, 
      extension: extension,
      userId: userId,
      parentDirId: parentDirId || req.user.rootDirId,
      isUploading: true, // Set true initially
    });

    // 4. Create S3 Key matching existing system pattern: fileId + extension
    const key = `${newFile._id}${extension}`;
    console.log("S3 Key:", key);

    // 5. Upload to S3
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: "varun-personal-stuff",
        Key: key,
        Body: driveStream,
        ContentType: contentType,
      },
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
      // console.log(progress);
    });

    console.log("Starting S3 upload...");
    await parallelUploads3.done();
    console.log("S3 upload complete.");

    // 6. Finalize File Record
    // If we didn't have size (exported doc), we might want to update it now if possible, 
    // but for now we'll stick with what we have or 0. 
    // Ideally we should headObject to get real size if 0.
    
    newFile.isUploading = false;
    await newFile.save();
    console.log("File record saved.");

    // 7. Update Directory Size
    if (newFile.parentDirId) {
        await updateDirectorySize(newFile.parentDirId, newFile.size);
    }

    res.status(200).json({ success: true, file: newFile });

  } catch (error) {
    console.error("Google Drive Import Error:", error);
    res.status(500).json({ error: "Failed to import file from Google Drive" });
  }
});

export default router;
