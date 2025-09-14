import express from "express";
import { createWriteStream } from "fs";
import { rename, rm } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STORAGE_PATH = join(__dirname, "../storage");

const router = express.Router();

// Create
router.post("/*", (req, res) => {
  const filePath = req.params[0];
  const writeStream = createWriteStream(join(STORAGE_PATH, filePath));
  req.pipe(writeStream);
  req.on("end", () => {
    res.json({ message: "File Uploaded" });
  });
});

// Read / Download
router.get("/*", (req, res) => {
  const filePath = req.params[0];
  const fullPath = join(STORAGE_PATH, filePath);

  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }

  res.sendFile(fullPath, (err) => {
    if (err) {
      res.json({ error: "File not Found" });
    }
  });
});

// Update (Rename)
router.patch("/*", async (req, res) => {
  const filePath = req.params[0];
  await rename(join(STORAGE_PATH, filePath), join(STORAGE_PATH, req.body.newFilename));
  res.json({ message: "Renamed" });
});

// Delete
router.delete("/*", async (req, res) => {
  const filePath = req.params[0];
  try {
    await rm(join(STORAGE_PATH, filePath), { recursive: true });
    res.json({ message: "File Deleted Successfully" });
  } catch (err) {
    res.status(404).json({ message: "File Not Found!" });
  }
});

export default router;
