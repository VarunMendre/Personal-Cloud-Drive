import { useState } from "react";
import {
  FaFolder,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
  FaDownload,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "../components/ContextMenu";
import { formatSize } from "./DetailsPopup";

function DirectoryItem({
  item,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  getFileIcon,
  isUploading,
  uploadProgress,
  handleCancelUpload,
  handleDeleteFile,
  handleDeleteDirectory,
  openRenameModal,
  openDetailsPopup,
  handleShare,
  BASE_URL,
  subscriptionStatus,
  showToast,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Convert the file icon string to the actual Icon component
  function renderFileIcon(iconString) {
    switch (iconString) {
      case "pdf":
        return <FaFilePdf className="text-red-600" />;
      case "image":
        return <FaFileImage className="text-purple-500" />;
      case "video":
        return <FaFileVideo className="text-red-500" />;
      case "archive":
        return <FaFileArchive className="text-yellow-600" />;
      case "code":
        return <FaFileCode className="text-blue-500" />;
      case "alt":
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  }

  const isUploadingItem = item.id.startsWith("temp-");

  const handleDownload = (e) => {
    e.stopPropagation();
    console.log("DirectoryItem handleDownload - status:", subscriptionStatus);
    if (subscriptionStatus?.toLowerCase() === "paused") {
      showToast("Your account is paused. Downloads are restricted.", "warning");
      return;
    }
    window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    openDetailsPopup(item);
  };

  // Helper to get file extension
  const getFileExtension = (filename) => {
    if (!filename || item.isDirectory) return null;
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return null;
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const fileExtension = getFileExtension(item.name);

  return (
    <div
      className="flex flex-col relative gap-1 border border-gray-200 rounded-lg bg-white cursor-pointer hover:bg-gray-50 group transition-colors"
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? "directory" : "file", item.id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {item.isDirectory ? (
            <FaFolder className="text-blue-500 text-2xl" />
          ) : (
            <div className="text-2xl">
              {renderFileIcon(getFileIcon(item.name))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Type Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 truncate">{item.name}</span>
            {item.isDirectory ? (
              <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                Folder
              </span>
            ) : fileExtension ? (
              <span className="px-2 py-0.5 text-xs font-medium text-red-600 bg-red-50 rounded">
                {fileExtension}
              </span>
            ) : null}
          </div>

          {/* Size and Modified Date */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>Size: {formatSize(item.size || 0)}</span>
            <span>Modified: {formatDate(item.updatedAt || item.createdAt)}</span>
          </div>
        </div>

        {/* Hover Action Buttons - Show on hover */}
        <div className="flex items-center gap-1">
          {isHovered && !isUploadingItem && (
            <>
              {/* Download button - only for files */}
              {!item.isDirectory && (
                <div className="relative group/tooltip">
                  <button
                    onClick={handleDownload}
                    className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                      subscriptionStatus === "paused"
                        ? "text-gray-400 cursor-not-allowed bg-gray-100"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                    title={subscriptionStatus === "paused" ? "" : "Download"}
                  >
                    <FaDownload className="text-sm" />
                  </button>
                  {subscriptionStatus === "paused" && (
                    <div className="absolute -top-8 right-0 bg-gray-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1 shadow-lg z-50 border border-gray-700">
                      <FaExclamationTriangle className="text-amber-500 w-2.5 h-2.5" />
                      Paused ⚠️
                    </div>
                  )}
                </div>
              )}
              
              {/* Details button - for both files and folders */}
              <button
                onClick={handleDetailsClick}
                className="flex items-center justify-center p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                title="Details"
              >
                <FaInfoCircle className="text-sm" />
              </button>
            </>
          )}

          {/* Three dots for context menu - always visible */}
          <div
            className="flex items-center justify-center text-xl cursor-pointer text-gray-700 rounded-full p-2 hover:bg-gray-200"
            onClick={(e) => handleContextMenu(e, item.id)}
          >
            <BsThreeDotsVertical />
          </div>
        </div>
      </div>

      {/* PROGRESS BAR: shown if an item is in queue or actively uploading */}
      {isUploadingItem && (
        <div className="bg-[#7c7c7c] rounded-[4px] mt-[5px] mb-[8px] overflow-hidden relative mx-[10px]">
          <span className="absolute text-[12px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white">{Math.floor(uploadProgress)}%</span>
          <div
            className="bg-[#007bff] rounded-[4px] h-[16px]"
            style={{
              width: `${uploadProgress}%`,
              backgroundColor: uploadProgress === 100 ? "#039203" : "#007bff",
            }}
          ></div>
        </div>
      )}

      {/* Context menu, if active */}
      {activeContextMenu === item.id && (
        <ContextMenu
          item={item}
          contextMenuPos={contextMenuPos}
          isUploadingItem={isUploadingItem}
          handleCancelUpload={handleCancelUpload}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          openRenameModal={openRenameModal}
          handleShare={handleShare}
          openDetailsPopup={openDetailsPopup}
          BASE_URL={BASE_URL}
          subscriptionStatus={subscriptionStatus}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default DirectoryItem;
