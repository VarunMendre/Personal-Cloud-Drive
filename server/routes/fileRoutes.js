import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";
import {
  completeFileUpload,
  deleteFile,
  getFile,
  getFileDetails,
  renameFile,
  uploadFileInitiate,
  cancelFileUpload,
} from "../controllers/fileController.js";
import { rateLimiters } from "../utils/rateLimiting.js";
import { throttlers } from "../utils/throttler.js";
import checkAuth, { checkUploadAccess, checkDownloadAccess } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.param("parentDirId", validateIdMiddleware);
router.param("id", validateIdMiddleware);

router.get("/:id", checkAuth, checkDownloadAccess, rateLimiters.getFile, throttlers.getFile, getFile);
router.get("/details/:id", getFileDetails);

router.patch(
  "/:id",
  checkAuth,
  checkUploadAccess,
  rateLimiters.renameFile,
  throttlers.renameFile,
  renameFile
);

router.delete(
  "/:id",
  checkAuth,
  checkUploadAccess,
  rateLimiters.deleteFile,
  throttlers.deleteFile,
  deleteFile
);

router.post(
  "/uploads/initiate",
  checkAuth,
  checkUploadAccess,
  uploadFileInitiate
);
router.post(
  "/uploads/complete",
  checkAuth,
  checkUploadAccess,
  completeFileUpload
);
router.post(
  "/uploads/cancel",
  checkAuth,
  checkUploadAccess,
  cancelFileUpload
);

export default router;
