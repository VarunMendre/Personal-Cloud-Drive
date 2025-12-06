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
  getUserList,
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
import { throttlers } from "../utils/throttler.js";
import { check } from "zod";

const router = express.Router();

// Public routes (no authentication needed)
router.post(
  "/user/register",
  rateLimiters.register,
  throttlers.register,
  register
);

router.post("/user/login", rateLimiters.login, throttlers.login, login);

// Protected routes (authentication required)
router.get(
  "/user",
  checkAuth,
  checkUserDeleted,
  throttlers.getCurrentUser,
  getCurrentUser
);
router.get(
  "/user/has-password",
  checkAuth,
  checkUserDeleted,
  throttlers.getUserPassword,
  getUserPassword
);
router.post(
  "/user/set-password",
  checkAuth,
  checkUserDeleted,
  rateLimiters.setPassword,
  throttlers.setPassword,
  setUserPassword
);

router.post(
  "/user/logout",
  checkAuth,
  rateLimiters.logout,
  throttlers.logout,
  logout
);
router.post(
  "/user/logout-all",
  checkAuth,
  rateLimiters.logoutAll,
  throttlers.logoutAll,
  logoutAll
);

// Role Based User Operations : Shows All Users, Logout, Soft Delete, Hard Delete
router.get(
  "/users",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  rateLimiters.getAllUsers,
  throttlers.getAllUsers,
  getAllUsers
);

router.post(
  "/users/:userId/logout",
  checkAuth,
  checkUserDeleted,
  checkNotRegularUser,
  rateLimiters.logoutById,
  throttlers.logoutById,
  logOutById
);

router.delete(
  "/users/:userId",
  checkAuth,
  checkUserDeleted,
  rateLimiters.deleteUser,
  throttlers.deleteUser,
  softDeleteUser
);
router.delete(
  "/users/:userId/hard",
  checkAuth,
  checkUserDeleted,
  checkIsOwnerOrAdmin,
  rateLimiters.hardDeleteUser,
  throttlers.hardDeleteUser,
  hardDeleteUser
);

router.put(
  "/users/:userId/recover",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.recoverUser,
  throttlers.recoverUser,
  recoverUser
);

// Owner : CRUD on users files, Admin: View,
router.get(
  "/users/:userId/files",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.getUserFiles,
  throttlers.getUserFiles,
  getUserFiles
);

router.delete(
  "/users/:userId/files/:fileId",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.deleteUserFiles,
  throttlers.deleteUserFiles,
  deleteUserFiles
);

router.get(
  "/users/:userId/files/:fileId/view",
  checkAuth,
  checkIsOwnerOrAdmin,
  rateLimiters.getUserFileView,
  throttlers.getUserFileView,
  getUserFileView
);

router.put(
  "/users/:userId/files/:fileId",
  checkAuth,
  checkIsOwner,
  rateLimiters.updateUserFile,
  throttlers.updateUserFile,
  updateUserFile
);

// Permissions Page & Changing Roles
router.get(
  "/users/permission",
  checkAuth,
  checkNotRegularUser,
  checkUserDeleted,
  throttlers.permissionPage,
  permissionPage
);

router.put(
  "/users/:userId/role",
  checkAuth,
  checkNotRegularUser,
  rateLimiters.updateUserRole,
  throttlers.updateUserRole,
  updateUserRole
);


// User List for sharing feature

router.get("/list", checkAuth, checkUserDeleted, getUserList)

export default router;
