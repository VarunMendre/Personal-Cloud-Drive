import { useState } from "react";
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Archive, 
  FileCode, 
  File, 
  Download, 
  Info, 
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import ContextMenu from "./ContextMenu";
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



  // Simplified icon rendering since getFileIcon now returns the component
  const renderIcon = () => {
    if (item.isDirectory) {
      return <Folder className="w-6 h-6" style={{ color: '#66B2D6' }} />;
    }
    return getFileIcon(item);
  };

  const isUploadingItem = item.id.startsWith("temp-");

  const handleDownload = (e) => {
    e.stopPropagation();
    e.preventDefault(); 
    
    const statusStr = String(subscriptionStatus || "").toLowerCase().trim();
    if (["halted", "expired", "paused"].includes(statusStr)) {
      showToast("Access Restricted: Your subscription is currently paused.", "warning");
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
    if (!filename || typeof filename !== 'string' || item.isDirectory) return null;
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
      className="flex flex-col relative gap-1 border rounded-lg bg-white cursor-pointer hover:bg-opacity-50 group transition-all duration-200"
      style={{ borderColor: '#D1D5DB' }}
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
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fafdff' }}>
            {renderIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Type Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate" style={{ color: '#000000' }}>{item.name}</span>
            {item.isDirectory ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded" style={{ backgroundColor: '#E6FAF5', color: '#66B2D6' }}>
                Folder
              </span>
            ) : fileExtension ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded" style={{ backgroundColor: '#fafdff', color: '#66B2D6' }}>
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
                    className="flex items-center justify-center p-2 rounded-full transition-colors text-[#000000] hover:bg-[#F3F4F6]"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Details button - for both files and folders */}
              <button
                onClick={handleDetailsClick}
                className="flex items-center justify-center p-2 text-[#000000] hover:bg-[#F3F4F6] rounded-full transition-colors"
                title="Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Three dots for context menu - always visible */}
          <div
            className="flex items-center justify-center cursor-pointer text-[#000000] rounded-full p-2 hover:bg-[#F3F4F6] transition-colors"
            onClick={(e) => handleContextMenu(e, item.id)}
          >
            <MoreVertical className="w-5 h-5" />
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
