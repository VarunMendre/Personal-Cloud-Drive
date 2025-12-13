import User from "../models/userModel.js";
import File from "../models/fileModel.js";
import Directory from "../models/directoryModel.js";

export const getSharedUsers = async (req, res) => {};

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
      Model = Directory;
    } else {
      return res.status(400).json({ error: "Invalid Resource Type" });
    }

    const resource = await Model.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource Not found" });
    }

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
      existingShare.role = role;
    } else {
      resource.sharedWith.push({
        userId: userTOShare._id,
        role: role,
        sharedAt: new Date(),
      });
    }

    resource.save();

    return res.status(200).json({ message: "Shared successfully" });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Failed to share resource" });
  }
};

export const updateUserAccess = async (req, res) => {};

export const removeUserAccess = async (req, res) => {};

export const generateShareLink = async (req, res) => {};

export const updateShareLink = async (req, res) => {};

export const disableShareLink = async (req, res) => {};

export const getDashboardStats = async (req, res) => {};

export const getRecentActivity = async (req, res) => {};

export const getSharedWithMe = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // 1. Find Files
    const sharedFiles = await File.find({
      "sharedWith.userId": currentUserId,
    })
      .populate("userId", "name email picture") // Populating owner details
      .lean();

    // 2. Find Folders
    const sharedFolders = await Directory.find({
      "sharedWith.userId": currentUserId,
    })
      .populate("userId", "name email picture")
      .lean();

    // 3. Format Files for Frontend
    const formattedFiles = sharedFiles.map((file) => {
      // Find the specific share object for this user to get their role/sharedAt
      const myShare = file.sharedWith.find(
        (s) => s.userId.toString() === currentUserId.toString()
      );

      return {
        fileId: file._id,
        fileName: file.name,
        fileType: "file", // Frontend uses this for filtering
        size: file.size,
        sharedBy: file.userId.name, // Frontend expects a name string
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
        fileId: folder._id, // Frontend key is 'fileId' even for folders based on your loop
        fileName: folder.name,
        fileType: "directory",
        size: folder.size,
        sharedBy: folder.userId.name,
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

export const getSharedByMe = async (req, res) => {};

export const getCollaborators = async (req, res) => {};
