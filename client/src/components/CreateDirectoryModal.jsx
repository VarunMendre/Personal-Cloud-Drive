import { useEffect, useRef } from "react";

function CreateDirectoryModal({
  newDirname,
  setNewDirname,
  onClose,
  onCreateDirectory,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus and select text only once on mount
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    // Listen for "Escape" key to close the modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup keydown event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Stop propagation when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Close when clicking outside the modal content
  const handleOverlayClick = () => {
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-[999]" onClick={handleOverlayClick}>
      <div className="bg-white p-5 w-[90%] max-w-[400px] rounded-[4px]" onClick={handleContentClick}>
        <h2 className="mt-0">Create a new directory</h2>
        <form onSubmit={onCreateDirectory} className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            className="p-[12px] my-[10px] border border-[#ccc] rounded-[4px] w-full box-border"
            placeholder="Enter folder name"
            value={newDirname}
            onChange={(e) => setNewDirname(e.target.value)}
          />
          <div className="flex justify-end gap-[10px]">
            <button className="bg-[#007bff] text-white py-[8px] px-[15px] border-none rounded-[4px] cursor-pointer hover:bg-[#0056b3]" type="submit">
              Create
            </button>
            <button
              className="bg-[#ccc] text-[#333] py-[8px] px-[15px] border-none rounded-[4px] cursor-pointer hover:bg-[#999]"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDirectoryModal;
