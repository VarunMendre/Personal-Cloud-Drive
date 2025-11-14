import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";
import {
  deleteFile,
  getFile,
  renameFile,
  uploadFile,
} from "../controllers/fileController.js";
import { rateLimiters } from "../utils/rateLimiting.js";

const router = express.Router();

router.param("parentDirId", validateIdMiddleware);
router.param("id", validateIdMiddleware);

router.post("/:parentDirId?", rateLimiters.uploadFile, uploadFile);

router.get("/:id", rateLimiters.getFile, getFile);

router.patch("/:id", rateLimiters.renameFile, renameFile);

router.delete("/:id", rateLimiters.deleteFile, deleteFile);

export default router;
