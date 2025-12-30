import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Pencil,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Download,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";
import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";

export default function UserFilesPage() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [targetUser, setTargetUser] = useState(location.state?.user || null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [previewFileType, setPreviewFileType] = useState("");

  const hasInitialized = useRef(false);
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (hasInitialized.current) return;
    
    const initData = async () => {
      // 1. We rely on AuthContext for currentUser. If not logged in, AuthContext handles it or we redirect.
      if (!currentUser) {
         // Optionally wait or redirect if strict auth is needed
         // But here we just proceed to fetch target user files
      }

      // 2. Fetch Target User if missing
      let tUser = targetUser;
      if (!tUser) {
        try {
          const res = await fetch(`${BASE_URL}/users`, { credentials: "include" });
          if (res.ok) {
            const usersList = await res.json();
            tUser = usersList.find((u) => (u._id || u.id) === userId);
            if (tUser) {
              setTargetUser(tUser);
            } else {
              alert("User not found or access denied.");
              navigate("/users");
              return;
            }
          } else {
            navigate("/users");
            return;
          }
        } catch (err) {
          console.error("Error fetching users:", err);
          navigate("/users");
          return;
        }
      }

      // 3. Fetch Files
      if (tUser) {
        await fetchFiles();
      }
      
      hasInitialized.current = true;
    };

    initData();
  }, [userId, currentUser]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/files`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || data);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
    if (["mp3", "wav"].includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
    if (["txt", "md", "js", "json", "html", "css"].includes(ext)) return "text";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
    return "download";
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "image": return <ImageIcon className="w-8 h-8 text-purple-500" />;
      case "video": return <Video className="w-8 h-8 text-red-500" />;
      case "audio": return <Music className="w-8 h-8 text-yellow-500" />;
      case "pdf": return <FileText className="w-8 h-8 text-red-600" />;
      case "text": return <FileText className="w-8 h-8 text-gray-500" />;
      case "office": return <FileText className="w-8 h-8 text-blue-500" />; // Placeholder for office
      default: return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  const handleViewClick = async (file) => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/files/${file._id || file.id}/view?format=json`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewFileUrl(data.url);
        setPreviewFileType(getFileType(file.name));
        setShowFilePreview(true);
      } else {
        console.error("Failed to fetch file view:", response.status);
        alert("Failed to view file. It may not exist or access is denied.");
      }
    } catch (err) {
      console.error("Error viewing file:", err);
      alert("Error viewing file.");
    }
  };

  const handleRenameClick = (file) => {
    setSelectedFile(file);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  // Auto-select filename without extension when modal opens
  useEffect(() => {
    if (showRenameModal && renameInputRef.current && newFileName) {
      const lastDotIndex = newFileName.lastIndexOf('.');
      renameInputRef.current.focus();
      if (lastDotIndex > 0) {
        // Select only the filename part (before the extension)
        renameInputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        // No extension, select all
        renameInputRef.current.select();
      }
    }
  }, [showRenameModal]); // Only run when modal opens, not when filename changes

  const confirmRenameFile = async () => {
    if (!selectedFile || !newFileName.trim()) return;
    try {
      const response = await fetch(
        `${BASE_URL}/users/${userId}/files/${selectedFile._id || selectedFile.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFileName.trim() }),
        }
      );
      if (response.ok) {
        setShowRenameModal(false);
        fetchFiles();
      }
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen flex flex-col pt-20">
      <DirectoryHeader
        userName={currentUser?.name || "Guest User"}
        userEmail={currentUser?.email || "guest@example.com"}
        userPicture={currentUser?.picture || ""}
        userRole={currentUser?.role || "User"}
        subscriptionId={currentUser?.subscriptionId}
        subscriptionStatus={currentUser?.subscriptionStatus || "active"}
      />
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/users")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{targetUser.name}</div>
              <div className="text-xs text-gray-500">{targetUser.email}</div>
            </div>
            {targetUser.picture ? (
              <img
                src={targetUser.picture}
                alt={targetUser.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                {targetUser.name.charAt(0)}
              </div>
            )}
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              {targetUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <File className="w-5 h-5 text-gray-400" />
          Files
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <File className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">This user hasn't uploaded any files yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file._id || file.id}
                className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 relative"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(getFileType(file.name))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getFileType(file.name).toUpperCase()}
                  </p>
                </div>
                
                {/* Hover Actions */}
                {currentUser?.role === "Owner" && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                    <button
                      onClick={() => handleViewClick(file)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRenameClick(file)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Rename File</h3>
              <p className="text-sm text-gray-500 mt-1">Change the name of this file</p>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {/* Current File Info */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="flex-shrink-0">
                  {getFileIcon(getFileType(selectedFile.name))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getFileType(selectedFile.name).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Input Field */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New File Name
                </label>
                <input
                  ref={renameInputRef}
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="Enter new file name"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRenameFile}
                  disabled={!newFileName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full max-w-6xl flex flex-col items-center justify-center">
            <button
              onClick={() => {
                setShowFilePreview(false);
                setPreviewFileUrl("");
              }}
              className="absolute top-4 right-4 z-[60] p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 hover:text-gray-200 transition-all"
              title="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-4">
              {previewFileType === "image" ? (
                <img
                  src={previewFileUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full bg-white rounded-lg shadow-2xl"
                  title="File Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
