import express from "express";
import { mkdir, readdir, stat } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STORAGE_PATH = join(__dirname, "../storage");

const router = express.Router();

// Read
router.get("/?*", async (req, res) => {
  const dirname = req.params[0] || "";
  const fullDirPath = join(STORAGE_PATH, dirname);

  try {
    const filesList = await readdir(fullDirPath);
    const resData = [];

    for (const item of filesList) {
      const stats = await stat(join(fullDirPath, item));
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }
    res.json(resData);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Create Directory
router.post("/?*", async (req, res) => {
  const dirname = req.params[0];
  try {
    await mkdir(join(STORAGE_PATH,dirname));
    res.json({ message: "Directory Created!" });
  } catch (err) {
    res.json({ err: err.message });
  }
});

export default router;
