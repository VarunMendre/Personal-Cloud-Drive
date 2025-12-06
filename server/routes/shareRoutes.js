import express from 'express';
import checkAuth from '../middlewares/authMiddleware.js';

const router = express.Router();

// Dashboard
router.get("/dashboard/stats", checkAuth);
router.get("/dashboard/activity", checkAuth);
router.get("/share-with-me", checkAuth);
router.get("/share-by-me", checkAuth);
router.get("/collaborators", checkAuth);


// Resource sharring routes

router.get("/:resourceType/:resourceId/shared-users", checkAuth);
router.post("/:resourceType/:resourceId/share", checkAuth);
router.patch("/:resourceType/:resourceId/share/:userId", checkAuth);
router.delete("/:resourceType/:resourceId/share/:userId", checkAuth);

// Share Link routes
router.post("/:resouceType/:resouceId/share-link", checkAuth);
router.patch("/:resourceType/:resourceId/share-link", checkAuth);
router.delete("/:resourceType/:resourceId/share-link", checkAuth);

export default router;