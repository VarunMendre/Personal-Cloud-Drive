import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const BASE_URL = "http://192.168.1.33";
  const [directoryItems, setDirectoryItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState("");
  const [currentPath, setCurrentPath] = useState("/");

  // Fetch items from a folder (default: currentPath)
  async function getDirectoryItems(path = currentPath) {
    const response = await fetch(`${BASE_URL}${path}`);
    const data = await response.json();
    setDirectoryItems(data);
    setCurrentPath(path);
  }

  useEffect(() => {
    getDirectoryItems("/");
  }, []);

  // Upload a file to the current folder
  async function uploadfile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${currentPath}`, true);
    xhr.setRequestHeader("filename", file.name);
    xhr.addEventListener("load", () => {
      console.log(xhr.response);
      getDirectoryItems();
      e.target.value = ""; // Clear file input after upload
    });
    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      setProgress(totalProgress.toFixed(2));
    });
    xhr.send(file);
  }

  // Delete a file or folder
  async function handleDelete(item) {
    const response = await fetch(`${BASE_URL}${currentPath}`, {
      method: "DELETE",
      body: JSON.stringify({ filename: item.name, type: item.type }),
    });
    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }

  // Rename a file/folder
  async function renameFile(oldFilename) {
    setNewFilename(oldFilename);
  }

  async function saveFilename(oldFilename) {
    const response = await fetch(`${BASE_URL}${currentPath}`, {
      method: "PATCH",
      body: JSON.stringify({ oldFilename, newFilename }),
    });
    const data = await response.text();
    console.log(data);
    setNewFilename("");
    getDirectoryItems();
  }

  // Create a folder in the current folder
  async function createFolder() {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    const response = await fetch(`${BASE_URL}${currentPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderName, type: "directory" }),
    });

    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }

  // Open a folder
  function openFolder(folderName) {
    const newPath = `${currentPath}${folderName}/`;
    getDirectoryItems(newPath);
  }

  // Go back to parent folder
  function goBack() {
    if (currentPath === "/") return;
    const parentPath = currentPath.slice(
      0,
      currentPath.lastIndexOf("/", currentPath.length - 2) + 1
    );
    getDirectoryItems(parentPath || "/");
  }

  return (
    <>
      <h1>My Files</h1>
      <p>Current Path: {currentPath}</p>
      <button onClick={goBack} disabled={currentPath === "/"}>⬅ Back</button>
      <br /><br />

      <input type="file" onChange={uploadfile} />
      <button onClick={createFolder}>Create Folder</button>
      <hr />

      <input
        type="text"
        onChange={(e) => setNewFilename(e.target.value)}
        value={newFilename}
      />
      <p>Progress: {progress}%</p>

      {directoryItems.map((item, i) => (
        <div key={i}>
          {item.type === "file" ? (
            <>
              📄 {item.name}{" "}
              <a href={`${BASE_URL}${currentPath}${item.name}?action=open`}>Open</a>{" "}
              <a href={`${BASE_URL}${currentPath}${item.name}?action=download`}>Download</a>
            </>
          ) : (
            <>
              📁 {item.name}{" "}
              <button onClick={() => openFolder(item.name)}>Open Folder</button>
            </>
          )}

          <button onClick={() => renameFile(item.name)}>Rename</button>
          <button onClick={() => saveFilename(item.name)}>Save</button>
          <button onClick={() => handleDelete(item)}>Delete</button>
          <br />
        </div>
      ))}
    </>
  );
}

export default App;
