import express from "express";
import { mkdir, readdir, stat } from "fs/promises";
import path from "path";

const router = express.Router();

// Read
router.get("/?*", async (req, res) => {
  const dirname = path.join("/", req.params[0]);
  const fullDirPath = `./storage/${dirname ? dirname : ""}`;

  try {
    const filesList = await readdir(fullDirPath);
    const resData = [];

    for (const item of filesList) {
      const stats = await stat(`${fullDirPath}/${item}`);
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }
    res.json(resData);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Create Directory
router.post("/?*", async (req, res) => {
  const dirname = path.join("/", req.params[0]);
  try {
    await mkdir(`./storage/${dirname}`);
    res.json({ message: "Directory Created!" });
  } catch (err) {
    res.json({ err: err.message });
  }
});

export default router;