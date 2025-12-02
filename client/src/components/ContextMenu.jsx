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
  openDetailsPopup,
  handleShare,
  BASE_URL,
}) {
  // FIXED - Define the missing itemClass
  const itemClass = "flex items-center gap-3 px-5 py-2 cursor-pointer whitespace-nowrap text-[#333] hover:bg-[#eee] transition-colors duration-200 text-sm";

  // Directory context menu
  if (item.isDirectory) {
    return (
      <div
        className="fixed bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] rounded-[4px] z-[999] py-[5px] min-w-[160px]"
        style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
      >
        {/* Share option */}
        <div
          className={itemClass}
          onClick={() => handleShare("directory", item.id, item.name)}
        >
          <FaShareAlt className="text-gray-600" />
          <span>Share</span>
        </div>
        <div
          className={itemClass}
          onClick={() => openRenameModal("directory", item.id, item.name)}
        >
          <FaPencilAlt className="text-gray-600" />
          <span>Rename</span>
        </div>
        <div
          className={itemClass}
          onClick={() => handleDeleteDirectory(item.id)}
        >
          <FaTrashAlt className="text-red-600" />
          <span className="text-red-600">Delete</span>
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
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
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
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          {/* Share option */}
          <div
            className={itemClass}
            onClick={() => handleShare("file", item.id, item.name)}
          >
            <FaShareAlt className="text-gray-600" />
            <span>Share</span>
          </div>
          <div
            className={itemClass}
            onClick={() =>
              (window.location.href = `${BASE_URL}/file/${item.id}?action=download`)
            }
          >
            <FaDownload className="text-gray-600" />
            <span>Download</span>
          </div>
          <div
            className={itemClass}
            onClick={() => openRenameModal("file", item.id, item.name)}
          >
            <FaPencilAlt className="text-gray-600" />
            <span>Rename</span>
          </div>
          <div
            className={itemClass}
            onClick={() => handleDeleteFile(item.id)}
          >
            <FaTrashAlt className="text-red-600" />
            <span className="text-red-600">Delete</span>
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