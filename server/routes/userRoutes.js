import express from "express";
import checkAuth, {
  checkIsOwner,
  checkIsOwnerOrAdmin,
  checkNotRegularUser,
  checkUserDeleted,
} from "../middlewares/authMiddleware.js";
import {
  deleteUserFiles,
  getAllUsers,
  getCurrentUser,
  getUserFiles,
  getUserFileView,
  getUserPassword,
  hardDeleteUser,
  login,
  logout,
  logoutAll,
  logOutById,
  permissionPage,
  recoverUser,
  register,
  setUserPassword,
  softDeleteUser,
  updateUserFile,
  updateUserRole,
} from "../controllers/userController.js";

const router = express.Router();

// Public routes (no authentication needed)
router.post("/user/register", register); 
router.post("/user/login", login); 

// Protected routes (authentication required)
router.get("/user", checkAuth, checkUserDeleted, getCurrentUser);
router.get("/user/has-password", checkAuth, checkUserDeleted, getUserPassword);
router.post("/user/set-password", checkAuth, checkUserDeleted, setUserPassword);
router.post("/user/logout", checkAuth, logout);
router.post("/user/logout-all", checkAuth, logoutAll);

// Role Based User Operations : Shows All Users, Logout, Soft Delete, Hard Delete
router.get(
  "/users",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  getAllUsers
);

router.post(
  "/users/:userId/logout",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  logOutById
);

router.delete("/users/:userId", checkAuth, checkUserDeleted, softDeleteUser);

router.delete(
  "/users/:userId/hard",
  checkAuth,
  checkUserDeleted,
  checkIsOwnerOrAdmin,
  hardDeleteUser
);

router.put(
  "/users/:userId/recover",
  checkAuth,
  checkIsOwnerOrAdmin,
  recoverUser
);

// Owner : CRUD on users files, Admin: View,
router.get(
  "/users/:userId/files",
  checkAuth,
  checkIsOwnerOrAdmin,
  getUserFiles
);

router.delete(
  "/users/:userId/files/:fileId",
  checkAuth,
  checkIsOwnerOrAdmin,
  deleteUserFiles
);

router.get(
  "/users/:userId/files/:fileId/view",
  checkAuth,
  checkIsOwnerOrAdmin,
  getUserFileView
);

router.put(
  "/users/:userId/files/:fileId",
  checkAuth,
  checkIsOwner, // Only Owner can rename files
  updateUserFile
);

// Permissions Page & Changing Roles
router.get(
  "/users/permission",
  checkAuth,
  checkNotRegularUser,
  checkUserDeleted,
  permissionPage
);

router.put(
  "/users/:userId/role",
  checkAuth,
  checkNotRegularUser,
  updateUserRole
);

export default router;
