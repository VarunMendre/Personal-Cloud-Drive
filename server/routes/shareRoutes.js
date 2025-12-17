import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import {
    disableShareLink,
  generateShareLink,
  getCollaborators,
  getDashboardStats,
  getRecentActivity,
  getSharedByMe,
  getSharedUsers,
  getSharedWithMe,
  removeUserAccess,
  shareWithUser,
  updateShareLink,
  updateUserAccess,
} from "../controllers/shareController.js";

const router = express.Router();

// Dashboard
router.get("/dashboard/stats", checkAuth, getDashboardStats);
router.get("/dashboard/activity", checkAuth, getRecentActivity);
router.get("/shared-with-me", checkAuth, getSharedWithMe);
router.get("/shared-by-me", checkAuth, getSharedByMe);
router.get("/collaborators", checkAuth, getCollaborators);

// Resource sharring routes

router.get(
  "/:resourceType/:resourceId/shared-users",
  checkAuth,
  getSharedUsers
);
router.post("/:resourceType/:resourceId/share", checkAuth, shareWithUser);
router.patch(
  "/:resourceType/:resourceId/share/:userId",
  checkAuth,
  updateUserAccess
);
router.delete(
  "/:resourceType/:resourceId/share/:userId",
  checkAuth,
  removeUserAccess
);

// Share Link routes
router.post(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  generateShareLink
);
router.patch(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  updateShareLink
);
router.delete(
    "/:resourceType/:resourceId/share-link",
    checkAuth,
    disableShareLink
);

export default router;
