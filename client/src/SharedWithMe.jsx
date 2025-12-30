import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFolder, FaFile, FaEye, FaEdit, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "./context/AuthContext";

import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";

function SharedWithMe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [directories, setDirectories] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSharedResources();
  }, []);

  const fetchSharedResources = async () => {
    try {
      const response = await fetch(`${BASE_URL}/share/shared-with-me`, {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Backend returns a combined array, so we filter it here
        setDirectories(data.filter((item) => item.fileType === "directory"));
        setFiles(data.filter((item) => item.fileType === "file"));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch shared resources");
      }
    } catch (err) {
      console.error("Error fetching shared resources:", err);
      setError("Error loading shared resources");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectoryClick = (dirId) => {
    navigate(`/directory/${dirId}`);
  };

  const handleFileClick = (fileId) => {
    window.location.href = `${BASE_URL}/file/${fileId}`;
  };

  const getRoleIcon = (role) => {
    return role === "editor" ? <FaEdit /> : <FaEye />;
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`inline-flex items-center gap-[6px] px-3 py-[6px] rounded-md text-xs font-semibold w-fit mt-auto ${role === "viewer" ? "bg-[#e3f2fd] text-[#1976d2]" : "bg-[#fff3e0] text-[#f57c00]"}`}>
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
        <div className="text-center py-[60px] px-5 text-white text-lg">Loading shared resources...</div>
      </div>
    );
  }

  const totalItems = directories.length + files.length;

  return (
    <>
      <DirectoryHeader
        directoryName="Shared with Me"
        path={[]}
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture}
        userRole={user?.role || "User"}
        subscriptionId={user?.subscriptionId}
        subscriptionStatus={user?.subscriptionStatus || "active"}
      />
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <div className="mb-8">
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors font-medium" onClick={() => navigate("/")}>
            <FaArrowLeft /> Back to My Drive
          </button>
        <h1 className="text-[32px] m-0 mb-2 text-[#333] max-[768px]:text-2xl max-[480px]:text-xl">Shared with Me</h1>
        <p className="text-[#666] text-sm m-0">
          {totalItems} {totalItems === 1 ? "item" : "items"} shared with you
        </p>
      </div>

      {error && <div className="bg-white px-5 py-4 rounded-lg text-[#c33] border-l-4 border-[#c33] mb-5">{error}</div>}

      {totalItems === 0 ? (
        <div className="bg-white py-[60px] px-5 rounded-xl text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
          <div className="text-[80px] mb-5 max-[480px]:text-[60px]">📂</div>
          <h2 className="text-2xl text-[#333] m-0 mb-3 max-[480px]:text-xl">No shared items yet</h2>
          <p className="text-[#666] text-base m-0 max-[480px]:text-sm">Files and folders shared with you will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Shared Directories */}
          {directories.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
              <h2 className="text-xl text-[#333] m-0 mb-5 pb-3 border-b-2 border-[#f0f0f0]">Folders</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 max-[768px]:grid-cols-1">
                {directories.map((dir) => (
                  <div
                    key={dir.id}
                    className="flex gap-4 p-4 border-2 border-[#f0f0f0] rounded-[10px] cursor-pointer transition-all duration-300 bg-white hover:border-[#667eea] hover:shadow-[0_4px_12px_rgba(102,126,234,0.2)] hover:-translate-y-0.5 max-[768px]:flex-col max-[768px]:items-center max-[768px]:text-center"
                    onClick={() => handleDirectoryClick(dir.id)}
                  >
                    <div className="w-[50px] h-[50px] flex items-center justify-center rounded-[10px] text-2xl flex-shrink-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white">
                      <FaFolder />
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-w-0 max-[768px]:items-center">
                      <h3 className="text-base font-semibold text-[#333] m-0 overflow-hidden text-ellipsis whitespace-nowrap">{dir.name}</h3>
                      <div className="flex flex-col gap-1 text-[13px] text-[#666] max-[768px]:items-center">
                        <span className="text-[#666]">
                          Shared by {dir.owner.name}
                        </span>
                        <span className="text-[#999] text-xs">
                          {formatDate(dir.sharedAt)}
                        </span>
                      </div>
                      {getRoleBadge(dir.role)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared Files */}
          {files.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
              <h2 className="text-xl text-[#333] m-0 mb-5 pb-3 border-b-2 border-[#f0f0f0]">Files</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 max-[768px]:grid-cols-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex gap-4 p-4 border-2 border-[#f0f0f0] rounded-[10px] cursor-pointer transition-all duration-300 bg-white hover:border-[#667eea] hover:shadow-[0_4px_12px_rgba(102,126,234,0.2)] hover:-translate-y-0.5 max-[768px]:flex-col max-[768px]:items-center max-[768px]:text-center"
                    onClick={() => handleFileClick(file.id)}
                  >
                    <div className="w-[50px] h-[50px] flex items-center justify-center rounded-[10px] text-2xl flex-shrink-0 bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white">
                      <FaFile />
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-w-0 max-[768px]:items-center">
                      <h3 className="text-base font-semibold text-[#333] m-0 overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</h3>
                      <div className="flex flex-col gap-1 text-[13px] text-[#666] max-[768px]:items-center">
                        <span className="text-[#666]">
                          Shared by {file.owner.name}
                        </span>
                        <span className="text-[#999] text-xs">
                          {formatDate(file.sharedAt)}
                        </span>
                      </div>
                      {getRoleBadge(file.role)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}

export default SharedWithMe;
