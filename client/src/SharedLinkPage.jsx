import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaFile, FaFileImage, FaDownload, FaExclamationTriangle } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function SharedLinkPage() {
  const { token } = useParams();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
                <FaExclamationTriangle className="w-8 h-8 text-red-500" />
            </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="text-sm text-gray-400">Error: 404 Not Found</div>
        </div>
      </div>
    );
  }

  const isImage = fileData?.fileType?.startsWith("image/") || fileData?.mimeType?.startsWith("image/");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6 flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center break-words max-w-full">
            {fileData?.name}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
                Shared by {fileData?.owner?.name || "Unknown User"}
            </p>
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
              <FaFile className="w-32 h-32 mb-4" />
              <p className="text-lg">Preview not available for this file type</p>
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-center">
            {fileData?.downloadUrl && (
                <a
                    href={fileData.downloadUrl}
                    download
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    <FaDownload className="w-4 h-4" />
                    Download
                </a>
            )}
        </div>
      </div>
    </div>
  );
}

export default SharedLinkPage;
