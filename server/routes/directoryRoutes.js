import express from "express";
import { mkdir, readdir, rm, stat, writeFile } from "fs/promises";
import path from "path";
import directoriesData from '../directoriesDB.json' with {type: "json"}
import filesData from '../filesDB.json' with {type: "json"}

const router = express.Router();

// Read
router.get("/:id?", async (req, res) => {
  const { id } = req.params
  const directoryData = id ? directoriesData.find((directory) => directory.id === id) : directoriesData[0]
  const files = directoryData.files.map((fileId) =>
    filesData.find((file) => file.id === fileId)
  )
  const directories = directoryData.directories.map((dirId) =>
    directoriesData.find((dir) => dir.id === dirId)
  ).map((({ id, name }) => ({ id, name })))
  res.json({ ...directoryData, files, directories })
});

router.post("/:parentDirId?", async (req, res) => {
  const parentDirId = req.params.parentDirId || directoriesData[0].id
  const { dirname } = req.headers
  const id = crypto.randomUUID()
  const parentDir = directoriesData.find((dir) => dir.id === parentDirId)
  parentDir.directories.push(id)
  directoriesData.push({
    id,
    name: dirname,
    parentDirId,
    files: [],
    directories: []
  })
  try {
    await writeFile('./directoriesDB.json', JSON.stringify(directoriesData))
    res.json({ message: "Directory Created!" })
  } catch (err) {
    res.status(404).json({ err: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const {id} = req.params
  const {newDirName} = req.body
  const dirData = directoriesData.find((dir) => dir.id === id)
  dirData.name = newDirName
  await writeFile('./directoriesDB.json', JSON.stringify(directoriesData))
  res.json({message: "Directory Renamed!"})
})

router.delete("/:id", async (req, res) => {
  const {id} = req.params
  try {
    const dirIndex = directoriesData.findIndex((directory) => directory.id === id)
    const directoryData = directoriesData[dirIndex]
    directoriesData.splice(dirIndex, 1)
    for await (const fileId of directoryData.files) {
      const fileIndex = filesData.findIndex((file) => file.id === fileId)
      const fileData = filesData[fileIndex]
      await rm(`./storage/${fileId}${fileData.extension}`);
      filesData.splice(fileIndex, 1)
    }
    for await (const dirId of directoryData.directories) {
      const dirIndex = directoriesData.findIndex(({id}) => id === dirId)
      directoriesData.splice(dirIndex, 1)
    }

    //deleting from main root directory's "directories"
    const parentDirData = directoriesData.find((dirData) => dirData.id === directoryData.parentDirId)
    parentDirData.directories = parentDirData.directories.filter((dirId) => dirId !== id)
    await writeFile('./filesDB.json', JSON.stringify(filesData))
    await writeFile('./directoriesDB.json', JSON.stringify(directoriesData))
    res.json({ message: "Directory Deleted!" });
  } catch (err) {
    console.log(err);
    res.json({ err: err.message });
  }
});

export default router;
