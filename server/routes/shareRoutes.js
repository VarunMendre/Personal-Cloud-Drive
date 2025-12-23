import express from "express";
import checkAuth, { checkUploadAccess } from "../middlewares/authMiddleware.js";
import {
    disableShareLink,
  generateShareLink,
  getCollaborators,
  getDashboardStats,
  getPublicSharedResource,
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
router.post("/:resourceType/:resourceId/share", checkAuth, checkUploadAccess, shareWithUser);
router.patch(
  "/:resourceType/:resourceId/share/:userId",
  checkAuth,
  checkUploadAccess,
  updateUserAccess
);
router.delete(
  "/:resourceType/:resourceId/share/:userId",
  checkAuth,
  checkUploadAccess,
  removeUserAccess
);

// Share Link routes
router.post(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  checkUploadAccess,
  generateShareLink
);
router.patch(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  checkUploadAccess,
  updateShareLink
);
router.delete(
    "/:resourceType/:resourceId/share-link",
    checkAuth,
    checkUploadAccess,
    disableShareLink
);


router.get("/link/:token", getPublicSharedResource);
export default router;
