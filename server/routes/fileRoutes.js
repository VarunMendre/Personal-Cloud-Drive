import express from "express";
import validateIdMiddleware from "../middlewares/validateIdMiddleware.js";
import { createFile, deleteFile, getFiles, renameFile } from "../controllers/filesController.js";

const router = express.Router();

router.param("parentDirId", validateIdMiddleware);
router.param("id", validateIdMiddleware);

router.post("/:parentDirId?", createFile);
router.get("/:id", getFiles);
router.patch("/:id", renameFile);
router.delete("/:id", deleteFile);

export default router;
