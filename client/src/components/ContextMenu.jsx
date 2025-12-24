import {
  FaInfoCircle,
  FaDownload,
  FaShareAlt,
  FaPencilAlt,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";

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
  // FIXED - Define the missing itemClass
  const itemClass = "flex items-center gap-3 px-5 py-2 cursor-pointer whitespace-nowrap text-[#333] hover:bg-[#eee] transition-colors duration-200 text-sm";
  const disabledClass = "flex items-center gap-3 px-5 py-2 cursor-not-allowed whitespace-nowrap text-gray-400 bg-gray-50 opacity-60 text-sm";

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
        className="fixed bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] rounded-[4px] z-[999] py-[5px] min-w-[160px]"
        style={menuStyle}
      >

        <div
          className={subscriptionStatus?.toLowerCase() === "paused" ? disabledClass : itemClass}
          onClick={() => subscriptionStatus?.toLowerCase() !== "paused" && openRenameModal("directory", item.id, item.name)}
        >
          <FaPencilAlt className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-300" : "text-gray-600"} />
          <span>Rename</span>
        </div>
        <div
          className={subscriptionStatus?.toLowerCase() === "paused" ? disabledClass : itemClass}
          onClick={() => subscriptionStatus?.toLowerCase() !== "paused" && handleDeleteDirectory(item.id)}
        >
          <FaTrashAlt className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-300" : "text-red-600"} />
          <span className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-400" : "text-red-600"}>Delete</span>
        </div>
        <div className={itemClass} onClick={() => openDetailsPopup(item)}>
          <FaInfoCircle className="text-gray-600" />
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
          className="fixed bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] rounded-[4px] z-[999] py-[5px] min-w-[160px]"
          style={menuStyle}
        >
          <div
            className={itemClass}
            onClick={() => handleCancelUpload(item.id)}
          >
            <FaTimes className="text-red-600" />
            <span className="text-red-600">Cancel</span>
          </div>
        </div>
      );
    } else {
      // Normal file
      return (
        <div
          className="fixed bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] rounded-[4px] z-[999] py-[5px] min-w-[160px]"
          style={menuStyle}
        >
          {/* Share option */}
          <div
            className={subscriptionStatus?.toLowerCase() === "paused" ? disabledClass : itemClass}
            onClick={() => subscriptionStatus?.toLowerCase() !== "paused" && handleShare("file", item.id, item.name)}
          >
            <FaShareAlt className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-300" : "text-gray-600"} />
            <span>Share</span>
          </div>
          <div
            className={itemClass}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const statusStr = String(subscriptionStatus || "").toLowerCase().trim();
              const isHalted = statusStr === "halted" || statusStr === "expired";
              console.log("ContextMenu download - statusStr:", statusStr, "isHalted:", isHalted);
              
              if (isHalted) {
                showToast("Your subscription has been halted/expired. Downloads are disabled.", "warning");
                return false;
              }
              window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
            }}
          >
            <FaDownload className="text-gray-600" />
            <span>Download</span>
          </div>
          <div
            className={subscriptionStatus?.toLowerCase() === "paused" ? disabledClass : itemClass}
            onClick={() => subscriptionStatus?.toLowerCase() !== "paused" && openRenameModal("file", item.id, item.name)}
          >
            <FaPencilAlt className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-300" : "text-gray-600"} />
            <span>Rename</span>
          </div>
          <div
            className={subscriptionStatus?.toLowerCase() === "paused" ? disabledClass : itemClass}
            onClick={() => subscriptionStatus?.toLowerCase() !== "paused" && handleDeleteFile(item.id)}
          >
            <FaTrashAlt className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-300" : "text-red-600"} />
            <span className={subscriptionStatus?.toLowerCase() === "paused" ? "text-gray-400" : "text-red-600"}>Delete</span>
          </div>
          <div className={itemClass} onClick={() => openDetailsPopup(item)}>
            <FaInfoCircle className="text-gray-600" />
            <span>Details</span>
          </div>
        </div>
      );
    }
  }
}

export default ContextMenu;