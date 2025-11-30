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
  handleShare,
  openDetailsPopup,
  BASE_URL,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Convert the file icon string to the actual Icon component
  function renderFileIcon(iconString) {
    switch (iconString) {
      case "pdf":
        return <FaFilePdf />;
      case "image":
        return <FaFileImage />;
      case "video":
        return <FaFileVideo />;
      case "archive":
        return <FaFileArchive />;
      case "code":
        return <FaFileCode />;
      case "alt":
      default:
        return <FaFileAlt />;
    }
  }

  const isUploadingItem = item.id.startsWith("temp-");

  const handleDownload = (e) => {
    e.stopPropagation();
    window.location.href = `${BASE_URL}/file/${item.id}?action=download`;
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    openDetailsPopup(item);
  };

  return (
    <div
      className="flex flex-col relative gap-1 border border-[#ccc] rounded-[4px] bg-[#f9f9f9] cursor-pointer hover:bg-[#f0f0f0] group"
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? "directory" : "file", item.id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex items-center gap-2"
        title={`Size: ${formatSize(
          item.size
        )}\nCreatedAt: ${new Date(item.createdAt).toLocaleString()}`}
      >
        <div className="flex items-center gap-2 p-[10px]">
          {item.isDirectory ? (
            <FaFolder className="text-[#ffa500] text-[1.2em]" />
          ) : (
            renderFileIcon(getFileIcon(item.name))
          )}
          <span>{item.name}</span>
        </div>

        {/* Hover Action Buttons - Show on hover */}
        <div className="ml-auto flex items-center gap-1 mr-1">
          {isHovered && !isUploadingItem && (
            <>
              {/* Download button - only for files */}
              {!item.isDirectory && (
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="Download"
                >
                  <FaDownload className="text-sm" />
                </button>
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
            className="flex items-center justify-center text-[1.2em] cursor-pointer text-[#2c2c2c] rounded-full p-2 hover:bg-[#dfdfdf]"
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
        />
      )}
    </div>
  );
}

export default DirectoryItem;
