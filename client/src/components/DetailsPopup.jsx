import { useEffect, useState } from "react";
import {
  Folder,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Archive,
  FileCode,
  X,
  Info,
  MapPin,
  Database,
  Calendar,
  Clock,
  Download,
} from "lucide-react";

export const formatSize = (bytes) => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  if (bytes >= KB) return (bytes / KB).toFixed() + " KB";
  return bytes + " B";
};

function DetailsPopup({ item, onClose, BASE_URL, subscriptionStatus, showToast }) {
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
          const pathArray = data.path || [];

          let pathStr = "";
          if (pathArray.length > 0) {
            const displayPath = [...pathArray];
            if (displayPath[0]) displayPath[0].name = "My Drive";
            pathStr = displayPath.map((p) => p.name).join(" / ");
          } else {
            pathStr = "My Drive";
          }

          pathStr += ` / ${name}`;

          setDetails((prev) => ({
            ...prev,
            path: pathStr,
            numberOfFiles: data.totalFiles || 0,
            numberOfFolders: data.totalFolders || 0,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch details", err);
        setDetails((prev) => ({ ...prev, path: "Error fetching path" }));
      }
    }
    fetchDetails();
  }, [id, isDirectory, BASE_URL, name]);

  const getFileType = (fileName) => {
    if (isDirectory) return "folder";
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
    if (["mp3", "wav"].includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
    if (
      [
        "txt",
        "md",
        "js",
        "json",
        "html",
        "css",
        "py",
        "java",
        "jsx",
        "ts",
        "tsx",
      ].includes(ext)
    )
      return "code";
    if (["zip", "rar", "tar", "gz"].includes(ext)) return "archive";
    return "file";
  };

  const getIcon = (type) => {
    switch (type) {
      case "folder":
        return <Folder className="w-10 h-10" style={{ color: '#66B2D6' }} />;
      case "image":
        return <ImageIcon className="w-10 h-10" style={{ color: '#9333EA' }} />;
      case "video":
        return <Video className="w-10 h-10" style={{ color: '#DC2626' }} />;
      case "audio":
        return <Music className="w-10 h-10" style={{ color: '#EAB308' }} />;
      case "pdf":
        return <FileText className="w-10 h-10" style={{ color: '#DC2626' }} />;
      case "code":
        return <FileCode className="w-10 h-10" style={{ color: '#10B981' }} />;
      case "archive":
        return <Archive className="w-10 h-10" style={{ color: '#F97316' }} />;
      default:
        return <File className="w-10 h-10" style={{ color: '#A3C5D9' }} />;
    }
  };

  const itemType = getFileType(name);
  const typeLabel = isDirectory
    ? "FOLDER"
    : getFileType(name).toUpperCase();
    
  const handleDownload = () => {
    const statusStr = String(subscriptionStatus || "").toLowerCase().trim();
    if (["halted", "expired", "paused"].includes(statusStr)) {
      showToast("Access Restricted: Your subscription is currently paused.", "warning");
      return;
    }
    window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-strong max-w-lg w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#E6FAF5' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E6FAF5' }}>
              <Info className="w-6 h-6" style={{ color: '#66B2D6' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#2C3E50' }}>Details</h3>
              <p className="text-sm mt-0.5" style={{ color: '#A3C5D9' }}>
                {isDirectory ? "Folder" : "File"} information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-opacity-10 transition-colors p-2 rounded-lg"
            style={{ color: '#A3C5D9' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Item Preview */}
          <div className="flex items-center gap-4 mb-6 pb-5 border-b" style={{ borderColor: '#E6FAF5' }}>
            <div className="flex-shrink-0">{getIcon(itemType)}</div>
            <div className="flex-1 min-w-0">
              <div
                className="font-medium truncate text-lg"
                title={name}
                style={{ color: '#2C3E50' }}
              >
                {name}
              </div>
              <div className="text-sm mt-1" style={{ color: '#A3C5D9' }}>{typeLabel}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#F0F8FF' }}>
                <MapPin className="w-4 h-4" style={{ color: '#66B2D6' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                  Location
                </div>
                <div className="text-sm break-all" style={{ color: '#A3C5D9' }}>{path}</div>
              </div>
            </div>

            {/* Size */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#F0F8FF' }}>
                <Database className="w-4 h-4" style={{ color: '#66B2D6' }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                  Size
                </div>
                <div className="text-sm" style={{ color: '#A3C5D9' }}>{formatSize(size)}</div>
              </div>
            </div>

            {/* Folder Contents */}
            {isDirectory && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#F0F8FF' }}>
                  <Folder className="w-4 h-4" style={{ color: '#66B2D6' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                    Contents
                  </div>
                  <div className="flex gap-4 text-sm" style={{ color: '#A3C5D9' }}>
                    <span>
                      {numberOfFiles} {numberOfFiles === 1 ? "File" : "Files"}
                    </span>
                    <span>•</span>
                    <span>
                      {numberOfFolders}{" "}
                      {numberOfFolders === 1 ? "Folder" : "Folders"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#F0F8FF' }}>
                <Calendar className="w-4 h-4" style={{ color: '#66B2D6' }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                  Created
                </div>
                <div className="text-sm" style={{ color: '#A3C5D9' }}>
                  {new Date(createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: '#F0F8FF' }}>
                <Clock className="w-4 h-4" style={{ color: '#66B2D6' }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1" style={{ color: '#2C3E50' }}>
                  Modified
                </div>
                <div className="text-sm" style={{ color: '#A3C5D9' }}>
                  {new Date(updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: '#E6FAF5' }}>
          {!isDirectory && (
             <button
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border-2"
              style={{
                color: '#66B2D6',
                backgroundColor: '#FFFFFF',
                borderColor: '#E6FAF5'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F0F8FF';
                e.target.style.borderColor = '#A7DDE9';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.borderColor = '#E6FAF5';
              }}
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          <button
            className="px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-medium"
            style={{ backgroundColor: '#66B2D6' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5aa0c0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#66B2D6'}
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
