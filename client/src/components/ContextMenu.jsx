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
  const itemClass = "context-menu-item";

  // Directory context menu
  if (item.isDirectory) {
    return (
      <div
        className="context-menu"
        style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
      >
        {/* Share option */}
        <div
          className={itemClass}
          onClick={() => handleShare("directory", item.id, item.name)}
        >
          Share
        </div>
        <div
          className={itemClass}
          onClick={() => openRenameModal("directory", item.id, item.name)}
        >
          Rename
        </div>
        <div
          className={itemClass}
          onClick={() => handleDeleteDirectory(item.id)}
        >
          Delete
        </div>
        <div className={itemClass} onClick={() => openDetailsPopup(item)}>
          Details
        </div>
      </div>
    );
  } else {
    // File context menu
    if (isUploadingItem && item.isUploading) {
      // Only show "Cancel"
      return (
        <div
          className="context-menu"
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          <div
            className={itemClass}
            onClick={() => handleCancelUpload(item.id)}
          >
            Cancel
          </div>
        </div>
      );
    } else {
      // Normal file
      return (
        <div
          className="context-menu"
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          {/* Share option */}
          <div
            className={itemClass}
            onClick={() => handleShare("file", item.id, item.name)}
          >
            Share
          </div>
          <div
            className={itemClass}
            onClick={() =>
              (window.location.href = `${BASE_URL}/file/${item.id}?action=download`)
            }
          >
            Download
          </div>
          <div
            className={itemClass}
            onClick={() => openRenameModal("file", item.id, item.name)}
          >
            Rename
          </div>
          <div
            className={itemClass}
            onClick={() => handleDeleteFile(item.id)}
          >
            Delete
          </div>
          <div className={itemClass} onClick={() => openDetailsPopup(item)}>
            Details
          </div>
        </div>
      );
    }
  }
}

export default ContextMenu;