import {
  FaFolder,
  FaFilePdf,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
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

  return (
    <div
      className="flex flex-col relative gap-1 border border-[#ccc] rounded-[4px] bg-[#f9f9f9] cursor-pointer hover:bg-[#f0f0f0]"
      onClick={() =>
        !(activeContextMenu || isUploading)
          ? handleRowClick(item.isDirectory ? "directory" : "file", item.id)
          : null
      }
      onContextMenu={(e) => handleContextMenu(e, item.id)}
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

        {/* Three dots for context menu */}
        <div
          className="flex items-center justify-center text-[1.2em] cursor-pointer ml-auto text-[#2c2c2c] rounded-full p-2 mr-1 hover:bg-[#dfdfdf]"
          onClick={(e) => handleContextMenu(e, item.id)}
        >
          <BsThreeDotsVertical />
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
