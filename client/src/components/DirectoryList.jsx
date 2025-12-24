import DirectoryItem from "./DirectoryItem";

function DirectoryList({
  items,
  handleRowClick,
  activeContextMenu,
  contextMenuPos,
  handleContextMenu,
  getFileIcon,
  isUploading,
  progressMap,
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
  return (
    <div className="flex flex-col gap-[10px] mt-5">
      {items.map((item) => {
        const uploadProgress = progressMap[item.id] || 0;

        return (
          <DirectoryItem
            key={item.id}
            item={item}
            handleRowClick={handleRowClick}
            activeContextMenu={activeContextMenu}
            contextMenuPos={contextMenuPos}
            handleContextMenu={handleContextMenu}
            getFileIcon={getFileIcon}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            handleCancelUpload={handleCancelUpload}
            handleDeleteFile={handleDeleteFile}
            handleDeleteDirectory={handleDeleteDirectory}
            openRenameModal={openRenameModal}
            openDetailsPopup={openDetailsPopup}
            handleShare={handleShare} 
            BASE_URL={BASE_URL}
            subscriptionStatus={subscriptionStatus}
            showToast={showToast}
          />
        );
      })}
    </div>
  );
}

export default DirectoryList;
