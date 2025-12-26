import {
  Info,
  Download,
  Share2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

function ContextMenu({
  item,
  contextMenuPos,
  isUploadingItem,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  openRenameModal,
  handleShare,
  openDetailsPopup,
  BASE_URL,
  subscriptionStatus,
  showToast,
}) {
  const isPaused = subscriptionStatus?.toLowerCase() === "paused";
  
  // Design system classes
  const itemClass = "flex items-center gap-3 px-4 py-2.5 cursor-pointer whitespace-nowrap transition-all duration-200 text-sm font-medium hover:bg-[#F0F8FF]";
  const disabledClass = "flex items-center gap-3 px-4 py-2.5 cursor-not-allowed whitespace-nowrap text-[#A3C5D9] bg-gray-50 opacity-60 text-sm font-medium";
  const textPrimary = "text-[#2C3E50]";
  const iconColor = "#66B2D6";
  const dangerColor = "#DC2626";

  // Determine position style
  const MENU_HEIGHT_ESTIMATE = 250; 
  const isNearBottom = typeof window !== 'undefined' && (contextMenuPos.y + MENU_HEIGHT_ESTIMATE > window.innerHeight);

  const menuStyle = {
    left: contextMenuPos.x,
    top: isNearBottom ? "auto" : contextMenuPos.y,
    bottom: isNearBottom ? (window.innerHeight - contextMenuPos.y) : "auto",
  };

  // Directory context menu
  if (item.isDirectory) {
    return (
      <div
        className="fixed bg-white shadow-strong rounded-xl z-[999] py-2 min-w-[180px] border animate-scaleIn"
        style={{ ...menuStyle, borderColor: '#E6FAF5' }}
      >
        <div
          className={isPaused ? disabledClass : `${itemClass} ${textPrimary}`}
          onClick={() => !isPaused && openRenameModal("directory", item.id, item.name, item.__v)}
        >
          <Pencil className="w-4 h-4" style={{ color: isPaused ? '#A3C5D9' : iconColor }} />
          <span>Rename</span>
        </div>
        <div
          className={isPaused ? disabledClass : itemClass}
          onClick={() => !isPaused && handleDeleteDirectory(item.id)}
        >
          <Trash2 className="w-4 h-4" style={{ color: isPaused ? '#A3C5D9' : dangerColor }} />
          <span style={{ color: isPaused ? '#A3C5D9' : dangerColor }}>Delete</span>
        </div>
        <div className={`${itemClass} ${textPrimary}`} onClick={() => openDetailsPopup(item)}>
          <Info className="w-4 h-4" style={{ color: iconColor }} />
          <span>Details</span>
        </div>
      </div>
    );
  } else {
    // File context menu
    if (isUploadingItem && item.isUploading) {
      // Only show "Cancel"
      return (
        <div
          className="fixed bg-white shadow-strong rounded-xl z-[999] py-2 min-w-[180px] border animate-scaleIn"
          style={{ ...menuStyle, borderColor: '#E6FAF5' }}
        >
          <div
            className={`${itemClass} text-red-600 font-semibold`}
            onClick={() => handleCancelUpload(item.id)}
          >
            <X className="w-4 h-4 text-red-600" />
            <span>Cancel Upload</span>
          </div>
        </div>
      );
    } else {
      // Normal file
      return (
        <div
          className="fixed bg-white shadow-strong rounded-xl z-[999] py-2 min-w-[180px] border animate-scaleIn"
          style={{ ...menuStyle, borderColor: '#E6FAF5' }}
        >
          {/* Share option */}
          <div
            className={isPaused ? disabledClass : `${itemClass} ${textPrimary}`}
            onClick={() => !isPaused && handleShare("file", item.id, item.name)}
          >
            <Share2 className="w-4 h-4" style={{ color: isPaused ? '#A3C5D9' : iconColor }} />
            <span>Share Link</span>
          </div>
          <div
            className={isPaused ? disabledClass : `${itemClass} ${textPrimary}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (isPaused) {
                showToast("Access Restricted: Your subscription is currently paused.", "warning");
                return;
              }
              window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
            }}
          >
            <Download className="w-4 h-4" style={{ color: isPaused ? '#A3C5D9' : iconColor }} />
            <span>Download</span>
          </div>
          <div
            className={isPaused ? disabledClass : `${itemClass} ${textPrimary}`}
            onClick={() => !isPaused && openRenameModal("file", item.id, item.name, item.__v)}
          >
            <Pencil className="w-4 h-4" style={{ color: isPaused ? '#A3C5D9' : iconColor }} />
            <span>Rename</span>
          </div>
          <div
            className={isPaused ? disabledClass : itemClass}
            onClick={() => !isPaused && handleDeleteFile(item.id)}
          >
            <Trash2 className="w-4 h-4" style={{ color: isPaused ? '#A3C5D9' : dangerColor }} />
            <span style={{ color: isPaused ? '#A3C5D9' : dangerColor }}>Delete</span>
          </div>
          <div className={`${itemClass} ${textPrimary}`} onClick={() => openDetailsPopup(item)}>
            <Info className="w-4 h-4" style={{ color: iconColor }} />
            <span>Details</span>
          </div>
        </div>
      );
    }
  }
}

export default ContextMenu;