import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DirectoryHeader from "./components/DirectoryHeader";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import DirectoryList from "./components/DirectoryList";
import ShareModal from "./components/ShareModal";
import DetailsPopup from "./components/DetailsPopup";
import ImportFromDrive from "./components/ImportFromDrive";
import { Alert, AlertTitle, AlertDescription } from "./components/lightswind/alert";
import { 
  Upload, 
  FolderPlus, 
  FilePlus, 
  AlertTriangle, 
  Info, 
  X,
  Folder,
  FileText,
  Image as ImageIcon,
  Video,
  Archive,
  FileCode,
  File,
  Search,
  Grid,
  List,
  ChevronDown,
  Home,
  Download,
  MoreVertical
} from "lucide-react";

// Helper function to format file sizes
const formatSize = (bytes) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  if (bytes >= KB) return (bytes / KB).toFixed() + " KB";
  return bytes + " B";
};

function DirectoryView() {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { dirId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

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
  const [renameVersion, setRenameVersion] = useState(undefined);
  const [isRenaming, setIsRenaming] = useState(false);
  const [extensionError, setExtensionError] = useState("");
  const [originalRenameValue, setOriginalRenameValue] = useState("");

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

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  // Context menu
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Search, view mode, and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [sortBy, setSortBy] = useState("name"); // "name", "date", "size"

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
      showToast(error.message, "error");
    }
  }

  useEffect(() => {
    getDirectoryItems();
    setActiveContextMenu(null);
  }, [dirId]);

  /**
   * Decide file icon - Safely handle item object or string
   */
  function getFileIcon(item) {
    const filename = typeof item === "string" ? item : item?.name || "";
    const isDir = typeof item === "object" ? item?.isDirectory : false;

    if (isDir) {
      return <Folder className="w-5 h-5" style={{ color: '#66B2D6' }} />;
    }

    if (!filename || typeof filename !== 'string') {
      return <File className="w-5 h-5" style={{ color: '#A3C5D9' }} />;
    }

    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="w-5 h-5" style={{ color: '#DC2626' }} />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "webp":
        return <ImageIcon className="w-5 h-5" style={{ color: '#9333EA' }} />;
      case "mp4":
      case "mov":
      case "avi":
      case "webm":
        return <Video className="w-5 h-5" style={{ color: '#DC2626' }} />;
      case "zip":
      case "rar":
      case "tar":
      case "gz":
        return <Archive className="w-5 h-5" style={{ color: '#F97316' }} />;
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "html":
      case "css":
      case "py":
      case "java":
      case "json":
        return <FileCode className="w-5 h-5" style={{ color: '#10B981' }} />;
      default:
        return <File className="w-5 h-5" style={{ color: '#A3C5D9' }} />;
    }
  }

  /**
   * Click row to open directory or file - Handle both (type, id) or (item)
   */
  function handleRowClick(typeOrItem, idIfType) {
    const type = typeof typeOrItem === "string" ? typeOrItem : (typeOrItem?.isDirectory ? "directory" : "file");
    const id = idIfType || typeOrItem?.id;

    if (!id) return;

    console.log("handleRowClick - status:", user?.subscriptionStatus);
    if (type === "directory") {
      navigate(`/directory/${id}`);
    } else {
    if (["halted", "expired", "paused"].includes(user?.subscriptionStatus?.toLowerCase())) {
      showToast("Your account is restricted. Downloads are disabled.", "warning");
      return;
    }
      
      // Fixed: Fetch the URL via JSON first to ensure auth cookies are sent cross-origin
      fetch(`${BASE_URL}/file/${id}?json=true`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            window.open(data.url, "_blank");
          } else if (data.error) {
            showToast(data.error, "error");
            if (data.status === 401) navigate("/login");
          }
        })
        .catch(err => {
          console.error("Error opening file:", err);
          showToast("Failed to open file", "error");
        });
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
      showToast("Failed to import from Drive: " + error.message, "error");
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
    if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
      showToast("Restricted access: Cannot upload files.", "warning");
      e.target.value = "";
      return;
    }
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
      showToast(`Upload failed: ${error.message}`, "error");

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
  /**
   * Delete a file/directory
   */
  async function handleDeleteFile(id) {
    if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
        showToast("Restricted access: Cannot delete files.", "warning");
        return;
    }

    setToast({ show: true, message: "Deleting file...", type: "loading" });
    setErrorMessage("");

    try {
      const response = await fetch(`${BASE_URL}/file/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await handleFetchErrors(response);
      
      // Update UI immediately (optimistic update could be done here, but we re-fetch)
      await getDirectoryItems();
      
      if (refreshStorageRef.current) {
        refreshStorageRef.current();
      }
      showToast("File deleted successfully", "success");
    } catch (error) {
      setErrorMessage(error.message);
      showToast(`Failed to delete file: ${error.message}`, "error");
    }
  }

  async function handleDeleteDirectory(id) {
    if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
        showToast("Restricted access: Cannot delete folders.", "warning");
        return;
    }

    setToast({ show: true, message: "Deleting folder...", type: "loading" });
    setErrorMessage("");

    try {
      const response = await fetch(`${BASE_URL}/directory/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await handleFetchErrors(response);
      
      await getDirectoryItems();
      
      if (refreshStorageRef.current) {
        refreshStorageRef.current();
      }
      showToast("Folder deleted successfully", "success");
    } catch (error) {
      setErrorMessage(error.message);
      showToast(`Failed to delete folder: ${error.message}`, "error");
    }
  }

  /**
   * Create a directory
   */
  async function handleCreateDirectory(e) {
    e.preventDefault();
    if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
      showToast("Restricted access: Cannot create directories.", "warning");
      return;
    }
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
      showToast(error.message, "error");
    }
  }

  /**
   * Rename
   */
  function openRenameModal(type, id, currentName, version) {
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setOriginalRenameValue(currentName);
    setRenameVersion(version);
    setExtensionError("");
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setIsRenaming(true);
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
            ? { newFilename: renameValue, version: renameVersion }
            : { newDirName: renameValue }
        ),
        credentials: "include",
      });

      if (response.status === 409) {
          showToast("Conflict: File modified by someone else. Refreshing...", "error");
          await getDirectoryItems();
          setShowRenameModal(false);
          return;
      }

      await handleFetchErrors(response);

      setShowRenameModal(false);
      setRenameValue("");
      setRenameType(null);
      setRenameId(null);
      setRenameVersion(undefined);
      getDirectoryItems();
    } catch (error) {
      setErrorMessage(error.message);
      showToast(error.message, "error");
    } finally {
      setIsRenaming(false);
    }
  }

  // Validate file extension when renaming files
  useEffect(() => {
    if (!showRenameModal || renameType !== "file" || !originalRenameValue || !renameValue) {
      setExtensionError("");
      return;
    }

    const originalExt = originalRenameValue.includes('.') ? originalRenameValue.split('.').pop().toLowerCase() : '';
    const newExt = renameValue.includes('.') ? renameValue.split('.').pop().toLowerCase() : '';

    if (originalExt && !newExt) {
      setExtensionError("File extension is required. Please keep the original extension.");
    } else if (originalExt && newExt && originalExt !== newExt) {
      setExtensionError(`Extension cannot be changed. Please keep '.${originalExt}' extension.`);
    } else {
      setExtensionError("");
    }
  }, [renameValue, originalRenameValue, renameType, showRenameModal]);

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

  // Combine, filter, and sort items
  const combinedItems = (() => {
    // Combine directories and files
    let items = [
      ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
      ...filesList.map((f) => ({ ...f, isDirectory: false })),
    ];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = item?.name || "";
        return typeof name === 'string' && name.toLowerCase().includes(query);
      });
    }

    // Sort items
    items.sort((a, b) => {
      // Always show directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      // Then sort by selected criteria
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case "size":
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });

    return items;
  })();

  return (
    <div className="min-h-screen pt-16">


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
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture || ""}
        userRole={user?.role || "User"}
        subscriptionId={user?.subscriptionId}
        subscriptionStatus={user?.subscriptionStatus || "active"}
      />

      {/* SUBSCRIPTION ALERTS */}
      {/* 1. PAUSED */}
      {user?.subscriptionStatus?.toLowerCase() === "paused" && (
        <div className="mx-6 mt-6 p-6 rounded-2xl shadow-medium animate-fadeIn" style={{ backgroundColor: '#FFF3CD', border: '2px solid #FDB827' }}>
           <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left" style={{ color: '#856404' }}>
             <div className="p-4 rounded-2xl" style={{ backgroundColor: '#FDB827' }}>
               <AlertTriangle className="w-10 h-10 text-white" />
             </div>
             <div>
               <h2 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>Account Paused</h2>
               <p className="text-sm mt-2" style={{ color: '#856404' }}>
                 Administrator has paused your account. Access is restricted.
               </p>
             </div>
           </div>
        </div>
      )}

      {/* 2. PENDING (Grace Period) */}
      {user?.subscriptionStatus?.toLowerCase() === "pending" && (
        <div className="mx-6 mt-6 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-xl shadow-md">
           <div className="flex flex-col sm:flex-row items-center gap-5 text-yellow-900 text-center sm:text-left">
             <div className="p-4 bg-yellow-100 rounded-2xl">
                <Info className="w-10 h-10 text-yellow-600 animate-pulse" />
             </div>
             <div className="flex-1">
               <h2 className="text-2xl font-bold">Payment Failed</h2>
               <p className="text-sm text-yellow-800 mt-2">
                 We couldn't process your renewal. You are in a grace period, but please update your payment method to avoid suspension.
               </p>
               <button 
                  onClick={() => navigate("/subscription")}
                  className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700"
               >
                 Retry Payment
               </button>
             </div>
           </div>
        </div>
      )}

      {/* 3. HALTED / EXPIRED (Hard Block) */}
      {["halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (
        <div className="mx-6 mt-6 p-6 bg-red-50 border-2 border-red-400 rounded-xl shadow-md">
           <div className="flex flex-col sm:flex-row items-center gap-5 text-red-900 text-center sm:text-left">
             <div className="p-4 bg-red-100 rounded-2xl">
                <X className="w-10 h-10 text-red-600" />
             </div>
             <div className="flex-1">
               <h2 className="text-2xl font-bold">Access Halted</h2>
               <p className="text-sm text-red-800 mt-2">
                 Your subscription has expired or payment failed repeatedly. Downloads are blocked.
               </p>
               <button 
                  onClick={() => navigate("/subscription")}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
               >
                 Fix Subscription
               </button>
             </div>
           </div>
        </div>
      )}

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
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-8">
        <div className="bg-white rounded-2xl border-2 border-dashed p-8 text-center shadow-soft transition-all duration-300 hover:shadow-medium" style={{ borderColor: '#A7DDE9' }}>
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E6FAF5' }}>
              <Upload className="w-8 h-8" style={{ color: '#66B2D6' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#2C3E50' }}>
              Upload Files or Create Directory
            </h2>
            <p className="text-sm" style={{ color: '#A3C5D9' }}>
              Drag and drop files here, or click to select files
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Upload Files Button */}
            <div className="relative group/btn cursor-not-allowed">
              <button
                onClick={() => {
                  if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
                    showToast("Restricted: Uploads disabled.", "warning");
                    return;
                  }
                  fileInputRef.current.click();
                }}
                disabled={errorMessage === "Directory not found or you do not have access to it!" || isRenaming}
                className="flex items-center gap-2 px-5 py-3 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: ["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) ? '#CBD5E0' : '#66B2D6',
                  cursor: ["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => !["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (e.target.style.backgroundColor = '#5aa0c0')}
                onMouseLeave={(e) => !["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (e.target.style.backgroundColor = '#66B2D6')}
              >
                <Upload className="w-4 h-4" />
                Upload Files {["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && "⚠️"}
              </button>
              {["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1 shadow-lg z-50">
                  <AlertTriangle className="text-amber-400 w-3 h-3" />
                  Access Restricted ⚠️
                </div>
              )}
            </div>

            {/* Create Directory Button */}
            <div className="relative group/btn cursor-not-allowed">
              <button
                onClick={() => {
                  if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
                    showToast("Restricted: Directory creation disabled.", "warning");
                    return;
                  }
                  setShowCreateDirModal(true);
                }}
                disabled={errorMessage === "Directory not found or you do not have access to it!" || isRenaming}
                className="flex items-center gap-2 px-5 py-3 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: ["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) ? '#CBD5E0' : '#10B981',
                  cursor: ["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => !["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (e.target.style.backgroundColor = '#059669')}
                onMouseLeave={(e) => !["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (e.target.style.backgroundColor = '#10B981')}
              >
                <FolderPlus className="w-4 h-4" />
                Create Directory {["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && "⚠️"}
              </button>
              {["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1 shadow-lg z-50">
                  <AlertTriangle className="text-amber-400 w-3 h-3" />
                  Access Restricted ⚠️
                </div>
              )}
            </div>

            {/* Import from Drive Button - NEW */}
            <div className="relative group/btn cursor-not-allowed">
              <div onClick={() => {
                if (["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase())) {
                  showToast("Restricted: Import disabled.", "warning");
                }
              }}>
                <ImportFromDrive
                  onFilesSelected={handleDriveFileImport}
                  disabled={["paused", "halted", "expired"].includes(user?.subscriptionStatus?.toLowerCase()) || isRenaming}
                  className={`flex items-center gap-2 px-5 py-3 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 font-semibold text-sm ${
                    user?.subscriptionStatus?.toLowerCase() === "paused" || isRenaming
                      ? "bg-gray-100 cursor-not-allowed opacity-50 grayscale pointer-events-none"
                      : "bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg hover:scale-105"
                  }`}
                />
              </div>
              {user?.subscriptionStatus?.toLowerCase() === "paused" && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1 shadow-lg z-50">
                  <AlertTriangle className="text-amber-400 w-3 h-3" />
                  Paused: Imports Disabled ⚠️
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search, View Toggle, and Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5" style={{ color: '#A3C5D9' }} />
            </div>
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border rounded-lg transition-all focus:outline-none"
              style={{ borderColor: '#D1DCE5', color: '#2C3E50' }}
              onFocus={(e) => e.target.style.borderColor = '#66B2D6'}
              onBlur={(e) => e.target.style.borderColor = '#D1DCE5'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                style={{ color: '#A3C5D9' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* View Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white border rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-soft whitespace-nowrap"
            style={{
              borderColor: '#D1DCE5',
              color: '#2C3E50'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#A7DDE9';
              e.target.style.backgroundColor = '#fafdff';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#D1DCE5';
              e.target.style.backgroundColor = '#FFFFFF';
            }}
          >
            {viewMode === "list" ? (
              <>
                <Grid className="w-5 h-5" />
                Grid View
              </>
            ) : (
              <>
                <List className="w-5 h-5" />
                List View
              </>
            )}
          </button>

          {/* Sort Filter Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-5 py-3 bg-white border rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-soft appearance-none pr-10 cursor-pointer"
              style={{
                borderColor: '#D1DCE5',
                color: '#2C3E50'
              }}
              onFocus={(e) => e.target.style.borderColor = '#66B2D6'}
              onBlur={(e) => e.target.style.borderColor = '#D1DCE5'}
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="w-5 h-5" style={{ color: '#2C3E50' }} />
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mt-4 flex items-center text-sm text-gray-600">
          {/* Home Icon */}
          <button
            onClick={() => navigate("/")}
            className="hover:text-black transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>

          {/* Path Segments */}
          {path && path.length > 0 ? (
            path.map((dir, index) => (
              <span key={dir._id} className="flex items-center">
                <span className="mx-2 text-gray-400">›</span>
                <button
                  onClick={() => navigate(`/directory/${dir._id}`)}
                  className="hover:text-black transition-colors"
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
          extensionError={extensionError}
          isProcessing={isRenaming}
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
          handleShare={handleShare}
          openDetailsPopup={openDetailsPopup} 
          subscriptionStatus={user?.subscriptionStatus}
          showToast={showToast}
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
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {combinedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border-2 hover:shadow-medium transition-all duration-200 cursor-pointer group flex flex-col justify-between overflow-hidden"
                style={{ borderColor: '#D1DCE5' }}
                onClick={() => handleRowClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <div className="p-4 flex-1 flex flex-col">
                  {/* Top Row: Icon and 3 Dots */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fafdff' }}>
                        {getFileIcon(item)}
                      </div>
                      <span className="text-xs font-semibold tracking-wider" style={{ color: '#A3C5D9' }}>
                        {item.isDirectory ? "FOLDER" : (item.name && typeof item.name === 'string' ? item.name.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE')}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRenaming) handleContextMenu(e, item);
                      }}
                      disabled={isRenaming}
                      className={`p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${isRenaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body: Name, Size, Date */}
                  <div className="space-y-1">
                    <h3 
                      className="text-sm font-semibold truncate mb-1" 
                      style={{ color: '#2C3E50' }}
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-2">
                       <div className="flex justify-between items-center text-xs">
                         <span style={{ color: '#A3C5D9' }}>Size</span>
                         <span className="font-medium" style={{ color: '#2C3E50' }}>
                           {item.isDirectory ? `${item.fileCount || 0} items` : formatSize(item.size)}
                         </span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                         <span style={{ color: '#A3C5D9' }}>Modified</span>
                         <span className="font-medium" style={{ color: '#2C3E50' }}>
                           {new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-US', {
                             year: 'numeric',
                             month: 'short',
                             day: 'numeric'
                           })}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Info | Download */}
                <div className="flex border-t" style={{ borderColor: '#D1DCE5' }}>
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetailsPopup(item);
                    }}
                    className="flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors border-r"
                    style={{ borderColor: '#D1DCE5', color: '#2C3E50' }}
                  >
                    <Info className="w-3.5 h-3.5" />
                    Info
                  </button>
                  
                  {!item.isDirectory ? (
                     <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const statusStr = String(user?.subscriptionStatus || "").toLowerCase().trim();
                        if (["halted", "expired", "paused"].includes(statusStr)) {
                          showToast("Access Restricted: Your subscription is currently paused.", "warning");
                          return;
                        }
                        window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
                      }}
                      className="flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                      style={{ color: '#2C3E50' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  ) : (
                    <div className="flex-1 bg-gray-50/50"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <DirectoryList
            items={combinedItems}
            handleRowClick={handleRowClick}
            activeContextMenu={activeContextMenu}
            subscriptionStatus={user?.subscriptionStatus}
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
            showToast={showToast}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-24 right-6 z-[100] max-w-sm w-full md:w-[380px]">
           <Alert 
             variant={toast.type === "error" ? "destructive" : toast.type === "success" ? "success" : toast.type === "warning" ? "warning" : "info"}
             withIcon
             dismissible
             duration={3000}
             onDismiss={() => setToast({ ...toast, show: false })}
             className="shadow-2xl bg-white/95 backdrop-blur-md border-gray-100"
           >
             <AlertDescription className="font-semibold">
               {toast.message}

             </AlertDescription>
           </Alert>
        </div>
      )}
    </div>
  );
}

export default DirectoryView;
