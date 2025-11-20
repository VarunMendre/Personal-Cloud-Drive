import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";
import {
  deleteFile,
  getFile,
  getFileDetails,
  renameFile,
  uploadFile,
} from "../controllers/fileController.js";
import { rateLimiters } from "../utils/rateLimiting.js";
import { throttlers } from "../utils/throttler.js";

const router = express.Router();

router.param("parentDirId", validateIdMiddleware);
router.param("id", validateIdMiddleware);

router.post(
  "/:parentDirId?",
  rateLimiters.uploadFile,
  throttlers.uploadFile,
  uploadFile
);

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

export default router;
