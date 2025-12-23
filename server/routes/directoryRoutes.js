import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";
import checkAuth, { checkDownloadAccess, checkUploadAccess } from "../middlewares/authMiddleware.js";

import {
  createDirectory,
  deleteDirectory,
  getDirectory,
  renameDirectory,
} from "../controllers/directoryController.js";
import { rateLimiters } from "../utils/rateLimiting.js";
import { throttlers } from "../utils/throttler.js";

const router = express.Router();

router.param("parentDirId", validateIdMiddleware);
router.param("id", validateIdMiddleware);

router.get(
  "/:id?",
  checkAuth,
  checkDownloadAccess,
  rateLimiters.getDirectory,
  throttlers.getDirectory,
  getDirectory
);

router.post(
  "/:parentDirId?",
  checkAuth,
  checkUploadAccess,
  rateLimiters.createDirectory,
  throttlers.createDirectory,
  createDirectory
);

router.patch(
  "/:id",
  checkAuth,
  checkUploadAccess,
  rateLimiters.renameDirectory,
  throttlers.renameDirectory,
  renameDirectory
);

router.delete(
  "/:id",
  checkAuth,
  checkUploadAccess,
  rateLimiters.deleteDirectory,
  throttlers.deleteDirectory,
  deleteDirectory
);

export default router;