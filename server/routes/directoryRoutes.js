import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";

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
  rateLimiters.getDirectory,
  throttlers.getDirectory,
  getDirectory
);

router.post(
  "/:parentDirId?",
  rateLimiters.createDirectory,
  throttlers.createDirectory,
  createDirectory
);

router.patch(
  "/:id",
  rateLimiters.renameDirectory,
  throttlers.renameDirectory,
  renameDirectory
);

router.delete(
  "/:id",
  rateLimiters.deleteDirectory,
  throttlers.deleteDirectory,
  deleteDirectory
);

export default router;
