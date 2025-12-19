import User from "../models/userModel.js";
import File from "../models/fileModel.js";
import Directory from "../models/directoryModel.js";
import { createCloudFrontSignedGetUrl } from "../services/cloudFront.js";
import { getFileUrl } from "../services/s3.js";

export const getSharedUsers = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const currentUserId = req.user._id;

    let Model;
    if (resourceType === "file") {
      Model = File;
    } else if (resourceType === "folder") {
      return res.status(400).json({ error: "Folder sharing is disabled" });
    } else {
      return res.status(400).json({ error: "Invalid Resource Type" });
    }

    const resource = await Model.findById(resourceId)
      .populate("userId", "name email picture")
      .populate("sharedWith.userId", "name email picture");

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Allow owner OR anyone who has access to view the shared list?
    // Usually only owner or editors should see this. For now, strict check for owner.
    // However, if I am a shared user opening this, I might need to see it too?
    // Let's stick to Owner + Shared users can see who else is on it.

    const isOwner = resource.userId._id.toString() === currentUserId.toString();
    const isShared = resource.sharedWith.some(
      (s) => s.userId && s.userId._id.toString() === currentUserId.toString()
    );

    if (!isOwner && !isShared) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      owner: resource.userId,
      sharedWith: resource.sharedWith.map((s) => ({
        userId: s.userId._id,
        name: s.userId.name,
        email: s.userId.email,
        picture: s.userId.picture,
        role: s.role,
        sharedAt: s.sharedAt,
      })),
      shareLink: resource.shareLink,
    });
  } catch (err) {
    console.error("Get Shared Users Error:", err);
    res.status(500).json({ error: "Failed to fetch shared users" });
  }
};

export const shareWithUser = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { email, role } = req.body;
    const currentUserId = req.user._id;

    if (!email || !role) {
      return res.status(400).json({ error: "Email & role are required" });
    }

    // Finding the user to share with

    const userTOShare = await User.findOne({ email });
    if (!userTOShare) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    if (userTOShare._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ error: "You cannot share yourself" });
    }

    // Find the Resource;

    let Model;

    if (resourceType === "file") {
      Model = File;
    } else if (resourceType === "folder") {
      return res.status(400).json({ error: "Folder sharing is disabled" });
    } else {
      return res.status(400).json({ error: "Invalid Resource Type" });
    }

    const resource = await Model.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource Not found" });
    }

    // Check if current user is Owner

    // Check if current user is Owner
    if (resource.userId.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ error: "Only the owner can share this resource" });
    }

    const existingShare = resource.sharedWith.find(
      (share) => share.userId.toString() === userTOShare._id.toString()
    );

    if (existingShare) {
      console.log(`Updating existing share for user ${userTOShare._id}`);
      existingShare.role = role;
    } else {
      console.log(`Adding new share for user ${userTOShare._id}`);
      resource.sharedWith.push({
        userId: userTOShare._id,
        role: role,
        sharedAt: new Date(),
      });
    }

    const savedResource = await resource.save();
    console.log(
      "Resource saved. SharedWith length:",
      savedResource.sharedWith.length
    );
    console.log(
      "Saved sharedWith array:",
      JSON.stringify(savedResource.sharedWith)
    );

    return res.status(200).json({ message: "Shared successfully" });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Failed to share resource" });
  }
};

export const updateUserAccess = async (req, res) => {
  try {
    const { resourceType, resourceId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user._id;

    let Model = resourceType === "file" ? File : Directory;
    const resource = await Model.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (resource.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const share = resource.sharedWith.find(
      (s) => s.userId.toString() === userId.toString()
    );

    if (share) {
      share.role = role;
      await resource.save();
    }

    res.json({ message: "Access updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update access" });
  }
};

export const removeUserAccess = async (req, res) => {
  try {
    const { resourceType, resourceId, userId } = req.params;
    const currentUserId = req.user._id;

    let Model = resourceType === "file" ? File : Directory;
    const resource = await Model.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (resource.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    resource.sharedWith = resource.sharedWith.filter(
      (s) => s.userId.toString() !== userId.toString()
    );

    await resource.save();
    res.json({ message: "Access removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove access" });
  }
};

export const generateShareLink = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user._id;

    if (resourceType !== "file") {
      return res.status(400).json({ error: "Only files can be shared" });
    }
    let Model = File;
    const resource = await Model.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (resource.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Generate random token
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // In a real app, you might want to use a more robust URL gen
    // For now, let's assume a frontend route structure like /shared/link/:token
    const linkUrl = `${req.get("origin")}/shared/link/${token}`;

    resource.shareLink = {
      token,
      url: linkUrl,
      role: role || "viewer",
      enabled: true,
      createdAt: new Date(),
    };

    await resource.save();

    res.json({ shareLink: resource.shareLink });
  } catch (err) {
    console.error("Link Gen Error", err);
    res.status(500).json({ error: "Failed to generate link" });
  }
};

export const updateShareLink = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user._id;

    let Model = resourceType === "file" ? File : Directory;
    const resource = await Model.findById(resourceId);

    if (!resource || resource.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: "Unauthorized or not found" });
    }

    if (resource.shareLink) {
      resource.shareLink.role = role;
      await resource.save();
    }

    res.json({ message: "Link updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update link" });
  }
};

export const disableShareLink = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const currentUserId = req.user._id;

    let Model = resourceType === "file" ? File : Directory;
    const resource = await Model.findById(resourceId);

    if (!resource || resource.userId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: "Unauthorized or not found" });
    }

    resource.shareLink = undefined;
    await resource.save();

    res.json({ message: "Link disabled" });
  } catch (err) {
    res.status(500).json({ error: "Failed to disable link" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    console.log("DEBUG: Getting dashboard stats for:", currentUserId);

    // 1. Shared With Me (Counts)
    const sharedWithMeCount = await File.countDocuments({
      "sharedWith.userId": currentUserId,
    });
    const sharedFoldersCount = await Directory.countDocuments({
      "sharedWith.userId": currentUserId,
    });

    // 2. Shared By Me (Counts)
    const sharedByMeCount = await File.countDocuments({
      userId: currentUserId,
      "sharedWith.0": { $exists: true },
    });
    const sharedFoldersByMeCount = await Directory.countDocuments({
      userId: currentUserId,
      "sharedWith.0": { $exists: true },
    });

    // 3. Collaborators (Bidirectional)
    const collaborators = new Set();

    // A. Peope I shared with (Receivers)
    const myFiles = await File.find({
      userId: currentUserId,
      "sharedWith.0": { $exists: true },
    }).select("sharedWith.userId");
    myFiles.forEach((f) =>
      f.sharedWith.forEach((s) => collaborators.add(s.userId.toString()))
    );

    // B. People who shared with me (Senders)
    const filesSharedWithMe = await File.find({
      "sharedWith.userId": currentUserId,
    }).select("userId");
    filesSharedWithMe.forEach((f) => {
      if (f.userId) collaborators.add(f.userId.toString());
    });

    // Do the same for folders if you want consistency, usually users prioritize files

    const stats = {
      sharedWithMe: sharedWithMeCount + sharedFoldersCount,
      sharedByMe: sharedByMeCount + sharedFoldersByMeCount,
      collaborators: collaborators.size,
    };

    console.log("DEBUG: Dashboard Stats calculated:", stats);

    res.json(stats);
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get recent files shared WITH me
    const files = await File.find({ "sharedWith.userId": currentUserId })
      .sort({ "sharedWith.sharedAt": -1 })
      .limit(5)
      .populate("userId", "name");

    const activities = files.map((f) => ({
      id: f._id,
      text: `Shared "${f.name}" with you`,
      date:
        f.sharedWith.find(
          (s) => s.userId.toString() === currentUserId.toString()
        )?.sharedAt || f.createdAt,
      user: f.userId.name,
    }));

    res.json(activities);
  } catch (err) {
    console.error("Recent Activity Error:", err);
    res.status(500).json({ error: "Failed to load activity" });
  }
};

export const getSharedWithMe = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    console.log(
      "DEBUG: Fetching shared with me. Current User ID:",
      currentUserId
    );

    // 1. Find Files
    console.log("DEBUG: Querying Files with:", {
      "sharedWith.userId": currentUserId,
    });

    const sharedFiles = await File.find({
      "sharedWith.userId": currentUserId,
    })
      .populate("userId", "name email picture")
      .lean();

    console.log("DEBUG: Raw Files Found:", sharedFiles.length);
    if (sharedFiles.length > 0) {
      console.log(
        "DEBUG: First file sharedWith:",
        JSON.stringify(sharedFiles[0].sharedWith)
      );
    }

    // 2. Find Folders
    const sharedFolders = await Directory.find({
      "sharedWith.userId": currentUserId,
    })
      .populate("userId", "name email picture")
      .lean();

    console.log("DEBUG: Raw Folders Found:", sharedFolders.length);

    console.log(
      `Found ${sharedFiles.length} files and ${sharedFolders.length} folders`
    );

    // 3. Format Files for Frontend
    const formattedFiles = sharedFiles.map((file) => {
      // find the specific share object for this user to get their role/sharedAt
      const myShare = file.sharedWith.find(
        (s) => s.userId.toString() === currentUserId.toString()
      );

      // Debug if myShare is missing but file was found (should not happen normally)
      if (!myShare)
        console.log(
          "WARN: Share object not found in array for file:",
          file._id
        );

      return {
        fileId: file._id,
        fileName: file.name,
        fileType: "file",
        size: file.size,
        sharedBy: file.userId?.name || "Unknown",
        sharedAt: myShare ? myShare.sharedAt : file.createdAt,
        permission: myShare ? myShare.role : "viewer",
      };
    });

    // 4. Format Folders for Frontend
    const formattedFolders = sharedFolders.map((folder) => {
      const myShare = folder.sharedWith.find(
        (s) => s.userId.toString() === currentUserId.toString()
      );

      return {
        fileId: folder._id,
        fileName: folder.name,
        fileType: "directory",
        size: folder.size,
        sharedBy: folder.userId?.name || "Unknown",
        sharedAt: myShare ? myShare.sharedAt : folder.createdAt,
        permission: myShare ? myShare.role : "viewer",
      };
    });

    // 5. Combine and Sort
    const combined = [...formattedFiles, ...formattedFolders].sort(
      (a, b) => new Date(b.sharedAt) - new Date(a.sharedAt)
    );

    res.json(combined);
  } catch (err) {
    console.error("Get Shared With Me Error:", err);
    res.status(500).json({ error: "Failed to fetch shared items" });
  }
};

export const getSharedByMe = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find files shared by me
    const files = await File.find({
      userId: currentUserId,
      "sharedWith.0": { $exists: true },
    })
      .populate("sharedWith.userId", "name email picture")
      .lean();

    // Find folders shared by me (optional, but good for completeness)
    const folders = await Directory.find({
      userId: currentUserId,
      "sharedWith.0": { $exists: true },
    })
      .populate("sharedWith.userId", "name email picture")
      .lean();

    const formattedFiles = files.map((f) => ({
      fileId: f._id,
      fileName: f.name,
      fileType: "file",
      size: f.size,
      sharedWith: f.sharedWith.map((s) => ({
        userId: s.userId?._id,
        name: s.userId?.name || "Unknown",
        email: s.userId?.email,
        role: s.role,
      })),
      sharedAt: f.createdAt,
      permission: "editor", // I am owner
    }));

    const formattedFolders = folders.map((f) => ({
      fileId: f._id,
      fileName: f.name,
      fileType: "directory",
      size: f.size,
      sharedWith: f.sharedWith.map((s) => ({
        userId: s.userId?._id,
        name: s.userId?.name || "Unknown",
        email: s.userId?.email,
        role: s.role,
      })),
      sharedAt: f.createdAt,
      permission: "editor",
    }));

    const combined = [...formattedFiles, ...formattedFolders].sort(
      (a, b) => new Date(b.sharedAt) - new Date(a.sharedAt)
    );

    res.json(combined);
  } catch (err) {
    console.error("Shared By Me Error", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
};

export const getCollaborators = async (req, res) => {
  res.json([]);
};

export const getPublicSharedResource = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Search in Files
    let resource = await File.findOne({
      "shareLink.token": token,
      "shareLink.enabled": true,
    }).populate("userId", "name email");

    let resourceType = "file";

    // 2. If not found in Files, return error (Folder sharing disabled)
    // if (!resource) {
    //   resource = await Directory.findOne({
    //     "shareLink.token": token,
    //     "shareLink.enabled": true,
    //   }).populate("userId", "name email");
    //   resourceType = "folder";
    // }

    if (!resource) {
      return res.status(404).json({ error: "Link invalid or disabled" });
    }

    // 3. Generate Signed URLs
    let downloadUrl = null;
    let previewUrl = null;

    if (resourceType === "file") {
      const s3Key = `${resource._id}${resource.extension}`;
      try {
        // Preview: Use CloudFront (Faster, Inline)
        previewUrl = createCloudFrontSignedGetUrl({
          key: s3Key,
          filename: resource.name,
          disposition: 'inline'
        });

        // Download: Use Direct S3 (User requested fallback)
        downloadUrl = await getFileUrl({
          Key: s3Key,
          download: true,
          filename: resource.name,
        });
      } catch (urlErr) {
        console.error("Error generating signed URL:", urlErr);
      }
    }

    // 4. Determine MIME type from extension
    const extension = resource.extension
      ? resource.extension.toLowerCase().replace(".", "")
      : "";
    const isImage = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "pdf"
    ].includes(extension);

    const mimeType = isImage
      ? `image/${extension}`
      : "application/octet-stream";

    // 5. Construct response
    res.json({
      name: resource.name,
      fileType: "file",
      mimeType: mimeType,
      size: resource.size,
      owner: resource.userId,
      createdAt: resource.createdAt,
      downloadUrl: downloadUrl, // S3 Signed URL
      previewUrl: previewUrl,   // CloudFront Signed URL
      role: resource.shareLink.role,
    });
  } catch (err) {
    console.error("Public Share Error:", err);
    res.status(500).json({ error: "Failed to load shared resource" });
  }
};