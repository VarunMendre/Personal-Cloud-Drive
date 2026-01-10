import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DirectoryHeader from "./components/DirectoryHeader";
import { FaArrowLeft, FaFileAlt, FaSearch, FaUsers } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function SharedByMePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchSharedFiles();
  }, []);

  const fetchSharedFiles = async () => {
    try {
      const response = await fetch(`${BASE_URL}/share/shared-by-me`, {
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

  const filteredFiles = sharedFiles.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || file.fileType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      <DirectoryHeader
        directoryName="Shared By Me"
        path={[]}
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture}
        userRole={user?.role || "User"}
      />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/share")}
            className="flex items-center gap-2 mb-4 text-sm font-medium transition-colors"
            style={{ color: '#66B2D6' }}
            onMouseEnter={(e) => e.target.style.color = '#5aa0c0'}
            onMouseLeave={(e) => e.target.style.color = '#66B2D6'}
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>Files Shared by Me</h1>
              <p className="text-sm" style={{ color: '#A3C5D9' }}>Manage files you've shared with others</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2" style={{ color: '#A3C5D9' }}>
            <span className="font-medium" style={{ color: '#66B2D6' }}>{filteredFiles.length} files</span>
            <span>•</span>
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border mb-6" style={{ borderColor: '#D1DCE5' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#A3C5D9' }} />
              <input
                type="text"
                placeholder="Search files or people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg transition-all text-sm focus:outline-none"
                style={{ 
                  backgroundColor: '#fafdff', 
                  borderColor: '#D1DCE5',
                  color: '#2C3E50'
                }}
                onFocus={(e) => e.target.style.borderColor = '#66B2D6'}
                onBlur={(e) => e.target.style.borderColor = '#D1DCE5'}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg transition-all text-sm focus:outline-none"
              style={{
                backgroundColor: '#fafdff',
                borderColor: '#D1DCE5',
                color: '#2C3E50'
              }}
              onFocus={(e) => e.target.style.borderColor = '#66B2D6'}
              onBlur={(e) => e.target.style.borderColor = '#D1DCE5'}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-700">Loading...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="w-10 h-10 text-green-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files shared yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                Start sharing files with your team to collaborate effectively.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                style={{ backgroundColor: '#66B2D6' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#5aa0c0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#66B2D6'}
              >
                Go to My Drive
              </button>
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
                      Shared With
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Shared Date
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
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaFileAlt className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {file.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {file.sharedWith.slice(0, 3).map((user, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                                title={user.name}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          {file.sharedWith.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{file.sharedWith.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(file.sharedAt)}</span>
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
                        <button 
                          onClick={() => navigate(`/share/manage/${file.fileType === 'directory' ? 'folder' : 'file'}/${file.fileId}`)}
                          className="text-sm font-medium hover:underline transition-colors"
                          style={{ color: '#66B2D6' }}
                          onMouseEnter={(e) => e.target.style.color = '#5aa0c0'}
                          onMouseLeave={(e) => e.target.style.color = '#66B2D6'}
                        >
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

export default SharedByMePage;
