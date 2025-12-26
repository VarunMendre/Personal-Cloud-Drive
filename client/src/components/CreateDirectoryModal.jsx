import { useEffect, useRef } from "react";
import { FaFolderPlus } from "react-icons/fa";

function CreateDirectoryModal({
  newDirname,
  setNewDirname,
  onClose,
  onCreateDirectory,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn modal-backdrop">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#E7F0FA' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E7F0FA' }}>
              <FaFolderPlus className="w-6 h-6" style={{ color: '#2E5E99'}} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: '#0D2440' }}>Create New Folder</h3>
              <p className="text-sm mt-0.5" style={{ color: '#7BA4D0' }}>Enter a name for your new folder</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={onCreateDirectory}>
          <div className="px-6 py-5">
            {/* Input Field */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0D2440' }}>
                Folder Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={newDirname}
                onChange={(e) => setNewDirname(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 rounded-lg transition-all focus:outline-none"
                style={{ borderColor: '#E7F0FA', color: '#0D2440' }}
                onFocus={(e) => e.target.style.borderColor = '#2E5E99'}
                onBlur={(e) => e.target.style.borderColor = '#E7F0FA'}
                placeholder="Enter folder name"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 border-2"
                style={{
                  color: '#2E5E99',
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E7F0FA'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#E7F0FA';
                  e.target.style.borderColor = '#7BA4D0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.borderColor = '#E7F0FA';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newDirname.trim()}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2E5E99' }}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#254a7f')}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2E5E99'}
              >
                Create Folder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDirectoryModal;
