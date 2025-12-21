import { useNavigate } from "react-router-dom";
import { FaShare, FaUsers, FaCrown } from "react-icons/fa";

// Use a constant for the API base URL
export const BASE_URL = import.meta.env.VITE_BASE_URL;

function DirectoryHeader({
  directoryName,
  path,
  disabled = false,
  onStorageUpdate,
  userName = "Guest User",
  userEmail = "guest@example.com",
  userPicture = "",
  userRole = "User",
}) {
  const navigate = useNavigate();

  // Navigate to settings when profile is clicked
  const handleProfileClick = () => {
    navigate("/settings");
  };

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <img
                src="/cloud-logo.png"
                alt="Cloud Storage Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900">Storage</span>
          </div>

          {/* Right side: Navigation Links + Profile */}
          <div className="flex items-center gap-6">
            {/* Action Buttons Group */}
            <div className="flex items-center gap-4">
              {/* Subscription Link */}
              <button
                onClick={() => navigate("/plans")}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaCrown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Subscription</span>
              </button>

              {/* Share Link */}
              <button
                onClick={() => navigate("/share")}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaShare className="w-4 h-4" />
                <span className="text-sm font-medium">Share</span>
              </button>

              {/* Users Link - Only for Owner/Admin/Manager */}
              {userRole !== "User" && (
                <button
                  onClick={() => navigate("/users")}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaUsers className="w-4 h-4" />
                  <span className="text-sm font-medium">Users</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200"></div>

            {/* Profile Section */}
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {userName}
                </div>
                <div className="text-xs text-gray-500">{userEmail}</div>
              </div>
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DirectoryHeader;
