import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  File, 
  Image as ImageIcon, 
  Download, 
  AlertTriangle, 
  Pencil, 
  Eye 
} from "lucide-react";
import RenameModal from "./components/RenameModal";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function SharedLinkPage() {
  const { token } = useParams();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [extensionError, setExtensionError] = useState("");
  const [originalExtension, setOriginalExtension] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        const response = await fetch(`${BASE_URL}/share/link/${token}`);
        if (!response.ok) {
           const data = await response.json();
           throw new Error(data.error || "Failed to load shared file");
        }
        const data = await response.json();
        setFileData(data);
      } catch (err) {
        console.error("Error fetching shared file:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedFile();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="text-sm text-gray-400">Error: 404 Not Found</div>
        </div>
      </div>
    );
  }

  const openRenameModal = () => {
      setRenameValue(fileData.name);
      // Extract and store the original extension
      const dotIndex = fileData.name.lastIndexOf(".");
      if (dotIndex > 0) {
        setOriginalExtension(fileData.name.substring(dotIndex));
      } else {
        setOriginalExtension("");
      }
      setExtensionError("");
      setShowRenameModal(true);
  };

  // Validate that extension hasn't changed
  const validateExtension = (newName) => {
    if (!originalExtension) return true; // No extension to validate
    
    const newDotIndex = newName.lastIndexOf(".");
    if (newDotIndex === -1) {
      setExtensionError(`File extension "${originalExtension}" is required`);
      return false;
    }
    
    const newExtension = newName.substring(newDotIndex);
    if (newExtension !== originalExtension) {
      setExtensionError(`Extension must remain "${originalExtension}"`);
      return false;
    }
    
    setExtensionError("");
    return true;
  };

  // Handle rename value change with validation
  const handleRenameChange = (newValue) => {
    setRenameValue(newValue);
    validateExtension(newValue);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submit
    if (!validateExtension(renameValue)) {
      return;
    }
    
    setIsRenaming(true);
    try {
        const response = await fetch(`${BASE_URL}/file/${fileData._id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-Share-Token": token, // Pass the share link token
            },
            body: JSON.stringify({ newFilename: renameValue }),
            credentials: "include", 
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to rename file");
        }

        setFileData(prev => ({ ...prev, name: renameValue }));
        setShowRenameModal(false);

    } catch (err) {
        console.error("Rename failed:", err);
        alert(`Rename failed: ${err.message}`);
    } finally {
        setIsRenaming(false);
    }
  };

  const isImage = fileData?.fileType?.startsWith("image/") || fileData?.mimeType?.startsWith("image/");

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6 flex flex-col items-center relative">
            {/* Permission Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              fileData?.role === 'editor' 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}>
              {fileData?.role === 'editor' ? (
                <>
                  <Pencil className="w-3 h-3" />
                  <span>Editor Access</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Viewer Only</span>
                </>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center break-words max-w-full">
            {fileData?.name}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
                Shared by {fileData?.owner?.name || "Unknown User"}
            </p>

            {/* Actions Toolbar - Moved to Header */}
            <div className="mt-6 flex justify-center gap-4 w-full">
                {fileData?.role === 'editor' ? (
                  <>
                    {fileData?.downloadUrl && (
                        <a
                            href={fileData.downloadUrl}
                            download
                            className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                            style={{ backgroundColor: '#66B2D6' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#5aa0c0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#66B2D6'}
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download
                        </a>
                    )}
                    <button
                        onClick={openRenameModal}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium shadow-sm hover:shadow-md text-sm"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Rename File
                    </button>
                  </>
                ) : (
                  <div className="px-5 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-100 cursor-not-allowed">
                      <Eye className="w-3.5 h-3.5" />
                      View Only Mode
                  </div>
                )}
            </div>
        </div>

        {/* Preview Area */}
        <div className="p-8 bg-gray-50 flex justify-center items-center min-h-[400px]">
          {isImage ? (
            <img
              src={fileData.downloadUrl || fileData.previewUrl} 
              alt={fileData.name}
              className="max-w-full max-h-[70vh] rounded-lg shadow-md object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <File className="w-32 h-32 mb-4" />
              <p className="text-lg">Preview not available for this file type</p>
            </div>
          )}
        </div>
      </div>

      {showRenameModal && (
        <RenameModal
            renameType="file"
            renameValue={renameValue}
            setRenameValue={handleRenameChange}
            onClose={() => setShowRenameModal(false)}
            onRenameSubmit={handleRenameSubmit}
            extensionError={extensionError}
            isProcessing={isRenaming}
        />
      )}
    </div>
  );
}

export default SharedLinkPage;
