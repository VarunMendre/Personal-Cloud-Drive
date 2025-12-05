import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import { FaArrowLeft, FaFileAlt, FaSearch, FaUserCircle } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function SharedWithMePage() {
  const navigate = useNavigate();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // User info for header
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [userPicture, setUserPicture] = useState("");
  const [userRole, setUserRole] = useState("User");

  useEffect(() => {
    fetchUser();
    fetchSharedFiles();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
        setUserEmail(data.email);
        setUserPicture(data.picture);
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const response = await fetch(`${BASE_URL}/share/shared-with-me`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSharedFiles(data);
      }
    } catch (err) {
      console.error("Error fetching shared files:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const filteredFiles = sharedFiles.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || file.fileType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DirectoryHeader
        directoryName="Shared With Me"
        path={[]}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
        userRole={userRole}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/share")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Files Shared with Me</h1>
              <p className="text-sm text-gray-500">Access files others have shared with you</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <span className="text-blue-600 font-medium">{filteredFiles.length} files</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Files (0)</option>
              <option value="document">Documents</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-700">Loading...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserCircle className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files shared with you</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                When someone shares a file with you, it will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shared By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shared Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFiles.map((file) => (
                    <tr key={file.fileId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaFileAlt className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {file.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{file.sharedBy}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(file.sharedAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            file.permission === "editor"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {file.permission === "editor" ? "Editor" : "Viewer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedWithMePage;
