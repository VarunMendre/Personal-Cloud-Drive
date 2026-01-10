import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";
import { FaShare, FaUsers, FaFileAlt, FaArrowRight } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function FileSharingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sharedWithMeCount: 0,
    sharedByMeCount: 0,
    collaboratorsCount: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${BASE_URL}/share/dashboard/stats`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  return (
    <div className="min-h-screen">
      <DirectoryHeader
        directoryName="File Sharing"
        path={[]}
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture}
        userRole={user?.role || "User"}
      />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C3E50' }}>File Sharing Dashboard</h1>
          <p style={{ color: '#2C3E50' }}>Manage your shared files and collaborations seamlessly</p>
          <p className="text-xs mt-1" style={{ color: '#A3C5D9' }}>Last updated: {new Date().toLocaleString()}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Shared With Me */}
          <div
            onClick={() => navigate("/share/shared-with-me")}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: '#E6FAF5' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#A7DDE9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#E6FAF5'}>
                <FaShare className="w-6 h-6" style={{ color: '#66B2D6' }} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.sharedWithMeCount}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Shared With Me</h3>
            <p className="text-xs text-gray-500 mb-3">Files others have shared</p>
            <button className="text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#66B2D6' }}>
              View All Files
              <FaArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Shared By Me */}
          <div
            onClick={() => navigate("/share/shared-by-me")}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <FaFileAlt className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.sharedByMeCount}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Shared By Me</h3>
            <p className="text-xs text-gray-500 mb-3">Files you've shared</p>
            <button className="text-xs text-green-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Manage Files
              <FaArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Collaborators */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaUsers className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.collaboratorsCount}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Collaborators</h3>
            <p className="text-xs text-gray-500 mb-3">People you work with</p>
            <div className="text-xs text-gray-400">Active users</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <p className="text-sm text-gray-600 mb-4">Common tasks to manage your files</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFileAlt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Upload & Share Files</h3>
                <p className="text-xs text-gray-500">Add new files to share</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/share/shared-by-me")}
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUsers className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Manage Permissions</h3>
                <p className="text-xs text-gray-500">Control who can access your files</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileSharingDashboard;
