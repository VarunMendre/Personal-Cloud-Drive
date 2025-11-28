import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";
import {
  completeFileUpload,
  deleteFile,
  getFile,
  getFileDetails,
  renameFile,
  uploadFileInitiate,
} from "../controllers/fileController.js";
import { rateLimiters } from "../utils/rateLimiting.js";
import { throttlers } from "../utils/throttler.js";
import checkAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.param("parentDirId", validateIdMiddleware);
router.param("id", validateIdMiddleware);

router.get("/:id", rateLimiters.getFile, throttlers.getFile, getFile);
router.get("/details/:id", getFileDetails);

router.patch(
  "/:id",
  rateLimiters.renameFile,
  throttlers.renameFile,
  renameFile
);

router.delete(
  "/:id",
  rateLimiters.deleteFile,
  throttlers.deleteFile,
  deleteFile
);

router.post("/uploads/initiate", checkAuth, uploadFileInitiate);
router.post("/uploads/complete", checkAuth, completeFileUpload);

export default router;
