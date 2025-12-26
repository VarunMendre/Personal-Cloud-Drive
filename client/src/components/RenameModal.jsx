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
  renameType,
  renameValue,
  setRenameValue,
  onClose,
  onRenameSubmit,
  extensionError,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();

      const dotIndex = renameValue.lastIndexOf(".");
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const getIcon = (type) => {
    switch (type) {
      case "folder": return <FaFolder className="w-8 h-8" style={{ color: '#2E5E99' }} />;
      case "image": return <FaFileImage className="w-8 h-8" style={{ color: '#9333EA' }} />;
      case "video": return <FaFileVideo className="w-8 h-8" style={{ color: '#DC2626' }} />;
      case "audio": return <FaFileAudio className="w-8 h-8" style={{ color: '#EAB308' }} />;
      case "pdf": return <FaFilePdf className="w-8 h-8" style={{ color: '#DC2626' }} />;
      case "code": return <FaFileCode className="w-8 h-8" style={{ color: '#10B981' }} />;
      case "archive": return <FaFileArchive className="w-8 h-8" style={{ color: '#F97316' }} />;
      default: return <FaFile className="w-8 h-8" style={{ color: '#7BA4D0' }} />;
    }
  };

  const itemType = getFileType(renameValue);
  const typeLabel = renameType === "directory" ? "FOLDER" : getFileType(renameValue).toUpperCase();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn modal-backdrop">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#E7F0FA' }}>
          <h3 className="text-lg font-bold" style={{ color: '#0D2440' }}>
            Rename {renameType === "file" ? "File" : "Folder"}
          </h3>
          <p className="text-sm mt-1" style={{ color: '#7BA4D0' }}>
            Change the name of this {renameType === "file" ? "file" : "folder"}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={onRenameSubmit}>
          <div className="px-6 py-5">
            {/* Current Item Info */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: '#E7F0FA' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E7F0FA' }}>
                {getIcon(itemType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" title={renameValue} style={{ color: '#0D2440' }}>
                  {renameValue}
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: '#7BA4D0' }}>
                  {typeLabel}
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0D2440' }}>
                New {renameType === "file" ? "File" : "Folder"} Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 rounded-lg transition-all focus:outline-none"
                style={{
                  borderColor: extensionError ? '#EF4444' : '#E7F0FA',
                  color: '#0D2440'
                }}
                onFocus={(e) => e.target.style.borderColor = extensionError ? '#EF4444' : '#2E5E99'}
                onBlur={(e) => e.target.style.borderColor = extensionError ? '#EF4444' : '#E7F0FA'}
                placeholder={`Enter new ${renameType === "file" ? "file" : "folder"} name`}
              />
              {extensionError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-fadeIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{extensionError}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border-2"
                style={{
                  color: '#2E5E99',
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E7F0FA'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#E7F0FA';
                  e.target.style.borderColor = '#7BA4D0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.borderColor = '#E7F0FA';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameValue.trim() || !!extensionError}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2E5E99' }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#254a7f')}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2E5E99'}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RenameModal;
