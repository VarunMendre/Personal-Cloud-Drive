import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DirectoryHeader from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";
import { FaShare, FaUsers, FaFileAlt, FaArrowRight, FaClock } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function FileSharingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sharedWithMeCount: 0,
    sharedByMeCount: 0,
    collaboratorsCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch(`${BASE_URL}/share/dashboard/activity`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (err) {
      console.error("Error fetching activity:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">File Sharing Dashboard</h1>
          <p className="text-gray-600">Manage your shared files and collaborations seamlessly</p>
          <p className="text-xs text-gray-400 mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Shared With Me */}
          <div
            onClick={() => navigate("/share/shared-with-me")}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FaShare className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.sharedWithMeCount}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Shared With Me</h3>
            <p className="text-xs text-gray-500 mb-3">Files others have shared</p>
            <button className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
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

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-500">Your latest shared files and collaborations</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-700">Loading...</span>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaClock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
                <p className="text-sm text-gray-500">
                  Start sharing files to see your activity here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaFileAlt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.action} • {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <button className="text-xs text-blue-600 font-medium hover:text-blue-700">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
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
