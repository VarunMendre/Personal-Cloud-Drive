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
import { rateLimiters } from "../utils/rateLimiting.js";

const router = express.Router();

// Public routes (no authentication needed)
router.post("/user/register", rateLimiters.register, register);
router.post("/user/login", rateLimiters.login, login);

// Protected routes (authentication required)
router.get("/user", checkAuth, checkUserDeleted, getCurrentUser);
router.get("/user/has-password", checkAuth, checkUserDeleted, getUserPassword);
router.post(
  "/user/set-password",
  checkAuth,
  checkUserDeleted,
  rateLimiters.setPassword,
  setUserPassword
);

router.post("/user/logout", checkAuth, rateLimiters.logout, logout);
router.post("/user/logout-all", checkAuth, rateLimiters.logoutAll, logoutAll);

// Role Based User Operations : Shows All Users, Logout, Soft Delete, Hard Delete
router.get(
  "/users",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  rateLimiters.getAllUsers,
  getAllUsers
);

router.post(
  "/users/:userId/logout",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  rateLimiters.logoutById,
  logOutById
);

router.delete(
  "/users/:userId",
  checkAuth,
  checkUserDeleted,
  rateLimiters.deleteUser,
  softDeleteUser
);
router.delete(
  "/users/:userId/hard",
  checkAuth,
  checkUserDeleted,
  checkIsOwnerOrAdmin,
  rateLimiters.hardDeleteUser,
  hardDeleteUser
);

router.put(
  "/users/:userId/recover",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.recoverUser,
  recoverUser
);

// Owner : CRUD on users files, Admin: View,
router.get(
  "/users/:userId/files",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.getUserFiles,
  getUserFiles
);

router.delete(
  "/users/:userId/files/:fileId",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.deleteUserFiles,
  deleteUserFiles
);

router.get(
  "/users/:userId/files/:fileId/view",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.getUserFileView,
  getUserFileView
);

router.put(
  "/users/:userId/files/:fileId",
  checkAuth,
  checkIsOwner,
  rateLimiters.updateUserFile,
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
  rateLimiters.updateUserRole,
  updateUserRole
);

export default router;
