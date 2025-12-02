import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import DirectoryList from "./components/DirectoryList";
import ShareModal from "./components/ShareModal";
import DetailsPopup from "./components/DetailsPopup";
import ImportFromDrive from "./components/ImportFromDrive";
import { FaUpload, FaFolderPlus, FaFileImport } from "react-icons/fa";


function DirectoryView() {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { dirId } = useParams();
  const navigate = useNavigate();

  // User info for header
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [userPicture, setUserPicture] = useState("");
  const [userRole, setUserRole] = useState("User");

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

  // Uploading states
  const fileInputRef = useRef(null);
  const [uploadQueue, setUploadQueue] = useState([]);
  const uploadQueueRef = useRef([]);
  const [uploadXhrMap, setUploadXhrMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [abortControllers, setAbortControllers] = useState({});

  // Storage refresh ref
  const refreshStorageRef = useRef(null);

  // Context menu
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Fetch user info
  const fetchUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
        setUserEmail(data.email);
        setUserPicture(data.picture);
        setUserRole(data.role);
      } else if (response.status === 401) {
        setUserName("Guest User");
        setUserEmail("guest@example.com");
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
   * Handle Import from Drive
   */
  // Import state
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Handle Import from Drive
   */
  async function handleDriveFileImport(file, token) {
    try {
      console.log("Importing file from Drive:", file);
      setIsImporting(true);
      
      const response = await fetch(`${BASE_URL}/import/google-drive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fileId: file.id,
          accessToken: token,
          parentDirId: dirId,
        }),
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      await handleFetchErrors(response);
      const data = await response.json();
      console.log("Import success:", data);
      
      // Refresh directory items
      getDirectoryItems();
      if (refreshStorageRef.current) {
        refreshStorageRef.current();
      }
      
    } catch (error) {
      console.error("Import from Drive failed:", error);
      setErrorMessage("Failed to import file from Google Drive: " + error.message);
    } finally {
      setIsImporting(false);
    }
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
      return data;
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

    setUploadXhrMap((prev) => ({ ...prev, [fileId]: xhr }));

    try {
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (evt) => {
          if (evt.lengthComputable) {
            const progress = (evt.loaded / evt.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("S3 upload failed due to network error"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

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
    uploadQueueRef.current = [...uploadQueueRef.current, ...newItems];

    e.target.value = "";

    if (!isUploading) {
      setIsUploading(true);
      processUploadQueue();
    }
  }

  /**
   * Process upload queue with S3 direct upload
   */
  async function processUploadQueue() {
    if (uploadQueueRef.current.length === 0) {
      setIsUploading(false);
      setUploadQueue([]);
      setTimeout(() => {
        getDirectoryItems();
        if (refreshStorageRef.current) {
          refreshStorageRef.current();
        }
      }, 1000);
      return;
    }

    const currentItem = uploadQueueRef.current[0];
    uploadQueueRef.current = uploadQueueRef.current.slice(1);
    setUploadQueue((prev) => prev.slice(1));

    const tempId = currentItem.id;

    try {
      console.log(`Initiating upload for: ${currentItem.name}`);
      const { fileId, uploadUrl } = await initiateUpload(
        currentItem.file,
        dirId
      );

      setFilesList((prev) =>
        prev.map((f) => (f.id === tempId ? { ...f, realFileId: fileId } : f))
      );

      console.log(`Uploading to S3: ${currentItem.name}`);
      await uploadToS3(uploadUrl, currentItem.file, fileId, (progress) => {
        setProgressMap((prev) => ({ ...prev, [tempId]: progress }));
      });

      console.log(`Completing upload: ${currentItem.name}`);
      await completeUpload(fileId);

      console.log(`Successfully uploaded: ${currentItem.name}`);

      setProgressMap((prev) => {
        const { [tempId]: _, ...rest } = prev;
        return rest;
      });

      processUploadQueue();
    } catch (error) {
      console.error(`Upload failed for ${currentItem.name}:`, error);

      setFilesList((prev) =>
        prev.filter(
          (f) => f.id !== tempId && f.realFileId !== currentItem.realFileId
        )
      );

      setProgressMap((prev) => {
        const { [tempId]: _, ...rest } = prev;
        return rest;
      });

      setErrorMessage(
        `Upload failed for ${currentItem.name}: ${error.message}`
      );

      processUploadQueue();
    }
  }

  /**
   * Cancel an in-progress upload
   */
  async function handleCancelUpload(fileId) {
    const xhr = uploadXhrMap[fileId];
    if (xhr) {
      xhr.abort();
    }

    try {
      const fileItem = filesList.find(
        (f) => f.id === fileId || f.realFileId === fileId
      );
      const realId =
        fileItem?.realFileId ||
        (fileId.toString().startsWith("temp-") ? null : fileId);

      if (realId) {
        console.log(`Notifying server to cancel upload for fileId: ${realId}`);
        fetch(`${BASE_URL}/file/uploads/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ fileId: realId }),
        }).catch((err) =>
          console.error("Failed to notify server of cancellation:", err)
        );
      }
    } catch (error) {
      console.error("Error in cancel logic:", error);
    }

    uploadQueueRef.current = uploadQueueRef.current.filter(
      (item) => item.id !== fileId && item.realFileId !== fileId
    );

    setUploadQueue((prev) =>
      prev.filter((item) => item.id !== fileId && item.realFileId !== fileId)
    );

    setFilesList((prev) =>
      prev.filter((f) => f.id !== fileId && f.realFileId !== fileId)
    );

    setProgressMap((prev) => {
      const { [fileId]: _, ...rest } = prev;
      return rest;
    });

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
    <div className="min-h-screen bg-gray-50">
      {errorMessage &&
        errorMessage !==
          "Directory not found or you do not have access to it!" && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errorMessage}
          </div>
        )}

      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-700 font-medium">Importing from Google Drive...</p>
          </div>
        </div>
      )}

      <DirectoryHeader
        directoryName={directoryName}
        path={path}
        disabled={
          errorMessage ===
          "Directory not found or you do not have access to it!"
        }
        onStorageUpdate={(refreshFn) => {
          refreshStorageRef.current = refreshFn;
        }}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
        userRole={userRole}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        style={{ display: "none" }}
        multiple
        onChange={handleFileSelect}
      />

      {/* Upload Section with 3 Buttons */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <div className="mb-4">
            <FaUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Upload Files or Create Directory
            </h2>
            <p className="text-gray-600 text-sm">
              Drag and drop files here, or click to select files
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Upload Files Button */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={
                errorMessage ===
                "Directory not found or you do not have access to it!"
              }
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-medium text-sm shadow-md"
            >
              <FaUpload className="w-4 h-4" />
              Upload Files
            </button>

            {/* Create Directory Button */}
            <button
              onClick={() => setShowCreateDirModal(true)}
              disabled={
                errorMessage ===
                "Directory not found or you do not have access to it!"
              }
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-medium text-sm shadow-md"
            >
              <FaFolderPlus className="w-4 h-4" />
              Create Directory
            </button>

            {/* Import from Drive Button - NEW */}
            <ImportFromDrive
              onFilesSelected={handleDriveFileImport}
              className="flex items-center gap-2 px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-medium text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mt-4 flex items-center text-sm text-gray-600">
          {/* Home Icon */}
          <button
            onClick={() => navigate("/")}
            className="hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>

          {/* Path Segments */}
          {path && path.length > 0 ? (
            path.map((dir, index) => (
              <span key={dir._id} className="flex items-center">
                <span className="mx-2 text-gray-400">›</span>
                <button
                  onClick={() => navigate(`/directory/${dir._id}`)}
                  className="hover:text-blue-600 transition-colors"
                >
                  {index === 0 ? "My Drive" : dir.name}
                </button>
              </span>
            ))
          ) : null}

          {/* Current Directory */}
          {directoryName && (
            <>
              <span className="mx-2 text-gray-400">›</span>
              <span className="text-gray-900 font-medium">
                {directoryName}
              </span>
            </>
          )}

          {/* Show "My Drive" when at root */}
          {!directoryName && (!path || path.length === 0) && (
            <>
              <span className="mx-2 text-gray-400">›</span>
              <span className="text-gray-900 font-medium">My Drive</span>
            </>
          )}
        </div>
      </div>

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

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {combinedItems.length === 0 ? (
          errorMessage ===
          "Directory not found or you do not have access to it!" ? (
            <p className="text-center text-gray-500 py-12">
              Directory not found or you do not have access to it!
            </p>
          ) : (
            <p className="text-center text-gray-500 py-12">
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
    </div>
  );
}

export default DirectoryView;
