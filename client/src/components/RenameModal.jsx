import { useEffect, useRef } from "react";
import {
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  FileCode,
  Edit3,
  AlertCircle
} from "lucide-react";

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
      case "folder":
        return <Folder className="w-8 h-8" style={{ color: '#66B2D6' }} />;
      case "image":
        return <Image className="w-8 h-8" style={{ color: '#9333EA' }} />;
      case "video":
        return <Video className="w-8 h-8" style={{ color: '#DC2626' }} />;
      case "audio":
        return <Music className="w-8 h-8" style={{ color: '#EAB308' }} />;
      case "pdf":
        return <FileText className="w-8 h-8" style={{ color: '#DC2626' }} />;
      case "code":
        return <FileCode className="w-8 h-8" style={{ color: '#10B981' }} />;
      case "archive":
        return <Archive className="w-8 h-8" style={{ color: '#F97316' }} />;
      default:
        return <File className="w-8 h-8" style={{ color: '#A3C5D9' }} />;
    }
  };

  const itemType = getFileType(renameValue);
  const typeLabel = renameType === "directory" ? "FOLDER" : getFileType(renameValue).toUpperCase();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn modal-backdrop">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#E6FAF5' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E6FAF5' }}>
              <Edit3 className="w-6 h-6" style={{ color: '#66B2D6' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#2C3E50' }}>
                Rename {renameType === "file" ? "File" : "Folder"}
              </h3>
              <p className="text-sm mt-1" style={{ color: '#A3C5D9' }}>
                Change the name of this {renameType === "file" ? "file" : "folder"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={onRenameSubmit}>
          <div className="px-6 py-5">
            {/* Current Item Info */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: '#E6FAF5' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F0F8FF' }}>
                {getIcon(itemType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" title={renameValue} style={{ color: '#2C3E50' }}>
                  {renameValue}
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: '#A3C5D9' }}>
                  {typeLabel}
                </div>
              </div>
            </div>

            {/* Input Field */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                New {renameType === "file" ? "File" : "Folder"} Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 rounded-lg transition-all focus:outline-none"
                style={{
                  borderColor: extensionError ? '#EF4444' : '#E6FAF5',
                  color: '#2C3E50'
                }}
                onFocus={(e) => e.target.style.borderColor = extensionError ? '#EF4444' : '#66B2D6'}
                onBlur={(e) => e.target.style.borderColor = extensionError ? '#EF4444' : '#E6FAF5'}
                placeholder={`Enter new ${renameType === "file" ? "file" : "folder"} name`}
              />
              {extensionError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-fadeIn">
                  <AlertCircle className="w-4 h-4" />
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
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameValue.trim() || !!extensionError}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#66B2D6' }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#5aa0c0')}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#66B2D6'}
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
