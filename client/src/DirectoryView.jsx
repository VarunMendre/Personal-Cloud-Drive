import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import DirectoryList from "./components/DirectoryList";
import ShareModal from "./components/ShareModal";
import DetailsPopup from "./components/DetailsPopup";
import "./DirectoryView.css";

function DirectoryView() {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { dirId } = useParams();
  const navigate = useNavigate();

  // Displayed directory name
  const [directoryName, setDirectoryName] = useState("My Drive");
  const [path, setPath] = useState([]);

  // Lists of items
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);

  // Error state
  const [errorMessage, setErrorMessage] = useState("");

  // Modal states
  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [newDirname, setNewDirname] = useState("New Folder");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareResourceType, setShareResourceType] = useState(null);
  const [shareResourceId, setShareResourceId] = useState(null);
  const [shareResourceName, setShareResourceName] = useState("");

  // Details modal state
  const [detailsItem, setDetailsItem] = useState(null);

  // Uploading states - UPDATED for S3
  const fileInputRef = useRef(null);
  const [uploadQueue, setUploadQueue] = useState([]);
  const uploadQueueRef = useRef([]); // Added Ref for synchronous queue access
  const [uploadXhrMap, setUploadXhrMap] = useState({}); // Keep this for compatibility
  const [progressMap, setProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [abortControllers, setAbortControllers] = useState({});

  // Storage refresh ref
  const refreshStorageRef = useRef(null);

  // Context menu
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Details functions
  const openDetailsPopup = (item) => {
    console.log("Opening details for:", item);
    setDetailsItem(item);
    setActiveContextMenu(null);
  };

  const closeDetailsPopup = () => setDetailsItem(null);

  /**
   * Utility: handle fetch errors
   */
  async function handleFetchErrors(response) {
    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const data = await response.json();
        if (data.error) errMsg = data.error;
      } catch (_) {
        // If JSON parsing fails, default errMsg stays
      }
      throw new Error(errMsg);
    }
    return response;
  }

  /**
   * Fetch directory contents
   */
  async function getDirectoryItems() {
    setErrorMessage("");
    try {
      const response = await fetch(`${BASE_URL}/directory/${dirId || ""}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      await handleFetchErrors(response);
      const data = await response.json();

      setDirectoryName(dirId ? data.name : "My Drive");
      setPath(data.path || []);
      setDirectoriesList([...data.directories].reverse());
      setFilesList([...data.files].reverse());
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    getDirectoryItems();
    setActiveContextMenu(null);
  }, [dirId]);

  /**
   * Decide file icon
   */
  function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf":
        return "pdf";
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return "image";
      case "mp4":
      case "mov":
      case "avi":
        return "video";
      case "zip":
      case "rar":
      case "tar":
      case "gz":
        return "archive";
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "html":
      case "css":
      case "py":
      case "java":
        return "code";
      default:
        return "alt";
    }
  }

  /**
   * Click row to open directory or file
   */
  function handleRowClick(type, id) {
    if (type === "directory") {
      navigate(`/directory/${id}`);
    } else {
      window.location.href = `${BASE_URL}/file/${id}`;
    }
  }

  /**
   * Handle Share
   */
  function handleShare(type, id, name) {
    setShareResourceType(type);
    setShareResourceId(id);
    setShareResourceName(name);
    setShowShareModal(true);
    setActiveContextMenu(null);
  }

  /**
   * S3 DIRECT UPLOAD - Step 1: Initiate upload
   */
  async function initiateUpload(file, parentDirId) {
    try {
      const response = await fetch(`${BASE_URL}/file/uploads/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          parentDirId: parentDirId || undefined,
        }),
      });

      if (response.status === 401) {
        navigate("/login");
        throw new Error("Unauthorized");
      }

      await handleFetchErrors(response);
      const data = await response.json();
      return data; // { fileId, uploadUrl }
    } catch (error) {
      console.error("Failed to initiate upload:", error);
      throw error;
    }
  }

  /**
   * S3 DIRECT UPLOAD - Step 2: Upload to S3
   */
  async function uploadToS3(uploadUrl, file, fileId, onProgress) {
    const xhr = new XMLHttpRequest();

    // Store XHR for cancellation (compatible with existing cancel logic)
    setUploadXhrMap((prev) => ({ ...prev, [fileId]: xhr }));

    try {
      return new Promise((resolve, reject) => {
        // Track progress
        xhr.upload.addEventListener("progress", (evt) => {
          if (evt.lengthComputable) {
            const progress = (evt.loaded / evt.total) * 100;
            onProgress(progress);
          }
        });

        // Handle completion
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        });

        // Handle errors
        xhr.addEventListener("error", () => {
          reject(new Error("S3 upload failed due to network error"));
        });

        // Handle abort
        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        // Send to S3
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream"
        );
        xhr.send(file);
      });
    } catch (error) {
      throw error;
    } finally {
      // Clean up XHR map
      setUploadXhrMap((prev) => {
        const copy = { ...prev };
        delete copy[fileId];
        return copy;
      });
    }
  }

  /**
   * S3 DIRECT UPLOAD - Step 3: Complete upload
   */
  async function completeUpload(fileId) {
    try {
      const response = await fetch(`${BASE_URL}/file/uploads/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileId: fileId,
        }),
      });

      if (response.status === 401) {
        navigate("/login");
        throw new Error("Unauthorized");
      }

      await handleFetchErrors(response);
      return await response.json();
    } catch (error) {
      console.error("Failed to complete upload:", error);
      throw error;
    }
  }

  /**
   * Select multiple files
   */
  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    console.log("Selected files:", selectedFiles);

    const newItems = selectedFiles.map((file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      return {
        file,
        name: file.name,
        size: file.size,
        id: tempId,
        isUploading: true,
        createdAt: new Date().toISOString(),
      };
    });

    setFilesList((prev) => [...newItems, ...prev]);

    newItems.forEach((item) => {
      setProgressMap((prev) => ({ ...prev, [item.id]: 0 }));
    });

    setUploadQueue((prev) => [...prev, ...newItems]);
    uploadQueueRef.current = [...uploadQueueRef.current, ...newItems]; // Update ref

    e.target.value = "";

    if (!isUploading) {
      setIsUploading(true);
      processUploadQueue();
    }
  }

  /**
   * Process upload queue with S3 direct upload
   */
  /**
   * Process upload queue with S3 direct upload
   */
  async function processUploadQueue() {
    if (uploadQueueRef.current.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setTimeout(() => {
        getDirectoryItems();
        // Refresh storage info after uploads complete
        if (refreshStorageRef.current) {
          refreshStorageRef.current();
        }
      }, 1000);
      return;
    }

    const currentItem = uploadQueueRef.current[0];
    // Remove the item we are about to process from the queue ref
    uploadQueueRef.current = uploadQueueRef.current.slice(1);
    
    // Update state to match (optional but good for debugging/consistency)
    setUploadQueue((prev) => prev.slice(1));

    const tempId = currentItem.id; // Keep reference to temp ID for progress tracking

    try {
      // Step 1: Initiate upload
      console.log(`Initiating upload for: ${currentItem.name}`);
      const { fileId, uploadUrl } = await initiateUpload(
        currentItem.file,
        dirId
      );

      // Update the temp ID to real fileId in UI
      setFilesList((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, realFileId: fileId } : f))
      );

      // Step 2: Upload to S3 - use tempId for progress tracking
      console.log(`Uploading to S3: ${currentItem.name}`);
      await uploadToS3(uploadUrl, currentItem.file, fileId, (progress) => {
        setProgressMap((prev) => ({ ...prev, [tempId]: progress }));
      });

      // Step 3: Complete upload
      console.log(`Completing upload: ${currentItem.name}`);
      await completeUpload(fileId);

      console.log(`Successfully uploaded: ${currentItem.name}`);

      // Clean up progress
      setProgressMap((prev) => {
        const { [tempId]: _, ...rest } = prev;
        return rest;
      });

      // Process next item
      processUploadQueue();
    } catch (error) {
      console.error(`Upload failed for ${currentItem.name}:`, error);

      // Remove failed item from UI
      setFilesList((prev) =>
        prev.filter(
          (f) => f.id !== tempId && f.realFileId !== currentItem.realFileId
        )
      );

      setProgressMap((prev) => {
        const { [tempId]: _, ...rest } = prev;
        return rest;
      });

      // Show error message
      setErrorMessage(
        `Upload failed for ${currentItem.name}: ${error.message}`
      );

      // Continue with rest of queue
      processUploadQueue();
    }
  }

  /**
   * Cancel an in-progress upload
   */
  async function handleCancelUpload(fileId) {
    // Abort the XHR upload if it's in progress
    const xhr = uploadXhrMap[fileId];
    if (xhr) {
      xhr.abort();
    }

    // Call server to clean up (delete from S3 and MongoDB)
    // We do this optimistically and don't wait for it to remove from UI
    try {
      // If it's a temp ID (starts with "temp-"), we might not have a real fileId yet
      // But if we do (stored in realFileId), we should use that.
      // The fileId passed to this function might be the tempId or realId depending on how it's called.
      // Looking at the UI rendering (not shown here but inferred), it likely passes the item.id.
      
      // Find the file in the list to get the realFileId if we only have tempId
      const fileItem = filesList.find(f => f.id === fileId || f.realFileId === fileId);
      const realId = fileItem?.realFileId || (fileId.toString().startsWith("temp-") ? null : fileId);

      if (realId) {
        console.log(`Notifying server to cancel upload for fileId: ${realId}`);
        fetch(`${BASE_URL}/file/uploads/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ fileId: realId }),
        }).catch(err => console.error("Failed to notify server of cancellation:", err));
      }
    } catch (error) {
      console.error("Error in cancel logic:", error);
    }

    // Remove from queue ref
    uploadQueueRef.current = uploadQueueRef.current.filter(
      (item) => item.id !== fileId && item.realFileId !== fileId
    );

    // Remove from queue state
    setUploadQueue((prev) =>
      prev.filter((item) => item.id !== fileId && item.realFileId !== fileId)
    );

    // Remove from UI
    setFilesList((prev) =>
      prev.filter((f) => f.id !== fileId && f.realFileId !== fileId)
    );

    // Clean up progress
    setProgressMap((prev) => {
      const { [fileId]: _, ...rest } = prev;
      return rest;
    });

    // Clean up XHR map
    setUploadXhrMap((prev) => {
      const copy = { ...prev };
      delete copy[fileId];
      return copy;
    });

    console.log(`Upload cancelled for fileId: ${fileId}`);
  }

  /**
   * Delete a file/directory
   */
  async function handleDeleteFile(id) {
    setErrorMessage("");
    try {
      const response = await fetch(`${BASE_URL}/file/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await handleFetchErrors(response);
      getDirectoryItems();
      // Refresh storage after delete
      if (refreshStorageRef.current) {
        refreshStorageRef.current();
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteDirectory(id) {
    setErrorMessage("");
    try {
      const response = await fetch(`${BASE_URL}/directory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await handleFetchErrors(response);
      getDirectoryItems();
      // Refresh storage after delete
      if (refreshStorageRef.current) {
        refreshStorageRef.current();
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Create a directory
   */
  async function handleCreateDirectory(e) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await fetch(`${BASE_URL}/directory/${dirId || ""}`, {
        method: "POST",
        headers: {
          dirname: newDirname,
        },
        credentials: "include",
      });
      await handleFetchErrors(response);
      setNewDirname("New Folder");
      setShowCreateDirModal(false);
      getDirectoryItems();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Rename
   */
  function openRenameModal(type, id, currentName) {
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    try {
      const url =
        renameType === "file"
          ? `${BASE_URL}/file/${renameId}`
          : `${BASE_URL}/directory/${renameId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          renameType === "file"
            ? { newFilename: renameValue }
            : { newDirName: renameValue }
        ),
        credentials: "include",
      });
      await handleFetchErrors(response);

      setShowRenameModal(false);
      setRenameValue("");
      setRenameType(null);
      setRenameId(null);
      getDirectoryItems();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  /**
   * Context Menu
   */
  function handleContextMenu(e, id) {
    e.stopPropagation();
    e.preventDefault();
    const clickX = e.clientX;
    const clickY = e.clientY;

    if (activeContextMenu === id) {
      setActiveContextMenu(null);
    } else {
      setActiveContextMenu(id);
      setContextMenuPos({ x: clickX - 110, y: clickY });
    }
  }

  useEffect(() => {
    function handleDocumentClick() {
      setActiveContextMenu(null);
    }
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const combinedItems = [
    ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
    ...filesList.map((f) => ({ ...f, isDirectory: false })),
  ];

  return (
    <div className="directory-view">
      {errorMessage &&
        errorMessage !==
          "Directory not found or you do not have access to it!" && (
          <div className="error-message">{errorMessage}</div>
        )}

      <DirectoryHeader
        directoryName={directoryName}
        path={path}
        onCreateFolderClick={() => setShowCreateDirModal(true)}
        onUploadFilesClick={() => fileInputRef.current.click()}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        disabled={
          errorMessage ===
          "Directory not found or you do not have access to it!"
        }
        onStorageUpdate={(refreshFn) => {
          refreshStorageRef.current = refreshFn;
        }}
      />

      {showCreateDirModal && (
        <CreateDirectoryModal
          newDirname={newDirname}
          setNewDirname={setNewDirname}
          onClose={() => setShowCreateDirModal(false)}
          onCreateDirectory={handleCreateDirectory}
        />
      )}

      {showRenameModal && (
        <RenameModal
          renameType={renameType}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onClose={() => setShowRenameModal(false)}
          onRenameSubmit={handleRenameSubmit}
        />
      )}

      {showShareModal && (
        <ShareModal
          resourceType={shareResourceType}
          resourceId={shareResourceId}
          resourceName={shareResourceName}
          onClose={() => {
            setShowShareModal(false);
            setShareResourceType(null);
            setShareResourceId(null);
            setShareResourceName("");
          }}
        />
      )}

      {detailsItem && (
        <DetailsPopup
          item={detailsItem}
          onClose={closeDetailsPopup}
          BASE_URL={BASE_URL}
        />
      )}

      {combinedItems.length === 0 ? (
        errorMessage ===
        "Directory not found or you do not have access to it!" ? (
          <p className="no-data-message">
            Directory not found or you do not have access to it!
          </p>
        ) : (
          <p className="no-data-message">
            This folder is empty. Upload files or create a folder to see some
            data.
          </p>
        )
      ) : (
        <DirectoryList
          items={combinedItems}
          handleRowClick={handleRowClick}
          activeContextMenu={activeContextMenu}
          contextMenuPos={contextMenuPos}
          handleContextMenu={handleContextMenu}
          getFileIcon={getFileIcon}
          isUploading={isUploading}
          progressMap={progressMap}
          handleCancelUpload={handleCancelUpload}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          openRenameModal={openRenameModal}
          openDetailsPopup={openDetailsPopup}
          handleShare={handleShare}
          BASE_URL={BASE_URL}
        />
      )}
    </div>
  );
}

export default DirectoryView;
