import { useEffect, useState } from "react";

export const formatSize = (bytes) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  if (bytes >= KB) return (bytes / KB).toFixed() + " KB";
  return bytes + " B";
};

function DetailsPopup({ item, onClose, BASE_URL }) {
  if (!item) return null;

  const [details, setDetails] = useState({
    path: "Loading...",
    size: 0,
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
    numberOfFiles: 0,
    numberOfFolders: 0,
  });

  const { id, name, isDirectory, size, createdAt, updatedAt } = item;
  const { path, numberOfFiles, numberOfFolders } = details;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function fetchDetails() {
      try {
        let url;
        if (isDirectory) {
           url = `${BASE_URL}/directory/${id}`;
        } else {
           url = `${BASE_URL}/file/details/${id}`;
        }

        const response = await fetch(url, { credentials: "include" });
        if (response.ok) {
            const data = await response.json();
            // Construct path string
            const pathArray = data.path || [];
            // For directory, append itself to path for display? User said "path : <path>"
            // Usually path means location.
            // If I am in /A/B and click details of B, path is /A/B.
            // If I click details of file.txt in B, path is /A/B/file.txt
            // Let's follow the user's example: resolvedPath.map...
            // But here we need a string or a list.
            // Let's make it a string: /Root/FolderA/FolderB
            
            let pathStr = "";
            if (pathArray.length > 0) {
                // Replace first item name with "My Drive"
                const displayPath = [...pathArray];
                if (displayPath[0]) displayPath[0].name = "My Drive";
                
                pathStr = displayPath.map(p => p.name).join(" / ");
            } else {
                pathStr = "My Drive"; 
            }
            
            // Append current item name
            pathStr += ` / ${name}`;

            setDetails(prev => ({
                ...prev,
                path: pathStr,
                // For directory, we might get size/counts if the endpoint provides it.
                // The current getDirectory endpoint returns files and directories lists.
                // We can calculate counts.
                numberOfFiles: data.files ? data.files.length : 0,
                numberOfFolders: data.directories ? data.directories.length : 0,
            }));
        }
      } catch (err) {
        console.error("Failed to fetch details", err);
        setDetails(prev => ({ ...prev, path: "Error fetching path" }));
      }
    }
    fetchDetails();
  }, [id, isDirectory, BASE_URL, name]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-md w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Name:</span> {name}
          </div>
          <div>
            <span className="font-semibold">Path:</span> {path}
          </div>
          <div>
            <span className="font-semibold">Size:</span> {formatSize(size)}
          </div>
          <div>
            <span className="font-semibold">Created At:</span>{" "}
            {new Date(createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-semibold">Updated At:</span>{" "}
            {new Date(updatedAt).toLocaleString()}
          </div>
          {isDirectory && (
            <>
              <div>
                <span className="font-semibold">Files:</span> {numberOfFiles}
              </div>
              <div>
                <span className="font-semibold">Folders:</span>{" "}
                {numberOfFolders}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsPopup;
