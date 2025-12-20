import { useEffect, useRef } from "react";
import {
  FaFolder,
  FaFile,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePdf,
  FaFileAlt,
  FaFileArchive,
  FaFileCode,
} from "react-icons/fa";

function RenameModal({
  // Modal for renaming files and folders
  renameType,
  renameValue,
  setRenameValue,
  onClose,
  onRenameSubmit,
  extensionError, // New prop for extension validation error
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus and select text only once on mount
    if (inputRef.current) {
      inputRef.current.focus();

      const dotIndex = renameValue.lastIndexOf(".");
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }

    // Listen for "Escape" key to close the modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup keydown event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Get file type based on extension
  const getFileType = (fileName) => {
    if (renameType === "directory") return "folder";
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
    if (["mp3", "wav"].includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
    if (["txt", "md", "js", "json", "html", "css", "py", "java", "jsx", "ts", "tsx"].includes(ext)) return "code";
    if (["zip", "rar", "tar", "gz"].includes(ext)) return "archive";
    return "file";
  };

  // Get appropriate icon
  const getIcon = (type) => {
    switch (type) {
      case "folder": return <FaFolder className="w-8 h-8 text-blue-500" />;
      case "image": return <FaFileImage className="w-8 h-8 text-purple-500" />;
      case "video": return <FaFileVideo className="w-8 h-8 text-red-500" />;
      case "audio": return <FaFileAudio className="w-8 h-8 text-yellow-500" />;
      case "pdf": return <FaFilePdf className="w-8 h-8 text-red-600" />;
      case "code": return <FaFileCode className="w-8 h-8 text-green-500" />;
      case "archive": return <FaFileArchive className="w-8 h-8 text-orange-500" />;
      default: return <FaFile className="w-8 h-8 text-gray-400" />;
    }
  };

  const itemType = getFileType(renameValue);
  const typeLabel = renameType === "directory" ? "FOLDER" : getFileType(renameValue).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Rename {renameType === "file" ? "File" : "Folder"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Change the name of this {renameType === "file" ? "file" : "folder"}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={onRenameSubmit}>
          <div className="px-6 py-5">
            {/* Current Item Info */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="flex-shrink-0">
                {getIcon(itemType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate" title={renameValue}>
                  {renameValue}
                </div>
                <div className="text-sm text-gray-500">
                  {typeLabel}
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New {renameType === "file" ? "File" : "Folder"} Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className={`w-full px-3 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 ${
                  extensionError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder={`Enter new ${renameType === "file" ? "file" : "folder"} name`}
              />
              {extensionError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{extensionError}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameValue.trim() || !!extensionError}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;
