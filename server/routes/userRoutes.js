import express from "express";
import checkAuth, {
  checkIsOwnerOrAdmin,
  checkNotRegularUser,
  checkUserDeleted,
} from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getCurrentUser,
  hardDeleteUser,
  login,
  logout,
  logoutAll,
  logOutById,
  permissionPage,
  recoverUser,
  register,
  softDeleteUser,
  updateUserRole,
} from "../controllers/userController.js";

const router = express.Router();

// User related Operation: Register, Login, logout, logout-all
router.get("/user", checkAuth, checkUserDeleted, getCurrentUser);
router.post("/user/register", checkUserDeleted, register);
router.post("/user/login", checkUserDeleted, login);

router.post("/user/logout", logout);
router.post("/user/logout-all", logoutAll);


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
