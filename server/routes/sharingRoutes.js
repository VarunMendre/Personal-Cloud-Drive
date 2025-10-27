import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import {
  accessViaShareLink,
  disableShareLink,
  generateShareLink,
  getSharedResource,
  getSharedUsers,
  getSharedWithMe,
  removeUserAccess,
  shareWithUser,
  updateShareLinkRole,
  updateUserAccess,
} from "../controllers/sharingController.js";

const router = express.Router();

// GET USERS WHO HAVE ACCESS
// Returns: { owner: {...}, sharedWith: [...], shareLink: {...} }
router.get(
  "/:resourceType/:resourceId/shared-users",
  checkAuth,
  getSharedUsers
);

// SHARE WITH SPECIFIC USER (via email)
// Body: { email: "user@example.com", role: "viewer" | "editor" }
router.post("/:resourceType/:resourceId/share", checkAuth, shareWithUser);

// UPDATE USER'S ACCESS LEVEL
// Body: { role: "viewer" | "editor" }
router.patch(
  "/:resourceType/:resourceId/share/:userId",
  checkAuth,
  updateUserAccess
);

// REMOVE USER'S ACCESS
router.delete(
  "/:resourceType/:resourceId/share/:userId",
  checkAuth,
  removeUserAccess
);

// GENERATE/GET SHAREABLE LINK
// Body: { role: "viewer" | "editor" }
// Returns: { token, role, url }

router.post(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  generateShareLink
);

// UPDATE SHARE LINK ROLE
// Body: { role: "viewer" | "editor" }
router.patch(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  updateShareLinkRole
);

// DISABLE SHARE LINK
router.delete(
  "/:resourceType/:resourceId/share-link",
  checkAuth,
  disableShareLink
);

// ACCESS RESOURCE VIA SHARE LINK (PUBLIC)
// No auth required - anyone with link can access
router.get("/link/:token", accessViaShareLink);

// GET SHARED RESOURCE CONTENT (PUBLIC)
router.get("/resource/:token", getSharedResource);

// GET ALL RESOURCES SHARED WITH ME
// Returns: { directories: [...], files: [...] }
router.get("/shared-with-me", checkAuth, getSharedWithMe);

export default router;
