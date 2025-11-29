import { useNavigate } from "react-router-dom";
import { FaShare, FaUsers } from "react-icons/fa";

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
}) {
  const navigate = useNavigate();

  // Navigate to settings when profile is clicked
  const handleProfileClick = () => {
    navigate("/settings");
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: Logo + Breadcrumb */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-16 h-16 flex items-center justify-center">
              <img
                src="/cloud-logo.png"
                alt="Cloud Storage Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-semibold text-gray-900">Storage</span>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600">
            {path && path.length > 0 ? (
              path.map((dir, index) => (
                <span key={dir._id} className="flex items-center">
                  <span
                    className="hover:text-blue-600 cursor-pointer transition-colors"
                    onClick={() => navigate(`/directory/${dir._id}`)}
                  >
                    {index === 0 ? "My Drive" : dir.name}
                  </span>
                  {index < path.length - 1 && (
                    <span className="mx-2 text-gray-400">/</span>
                  )}
                </span>
              ))
            ) : (
              <span className="text-lg font-medium text-gray-900">
                {directoryName || "My Drive"}
              </span>
            )}
            {path && path.length > 0 && (
              <>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-900 font-medium">
                  {directoryName}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Navigation Links + Profile */}
        <div className="flex items-center gap-6">
          {/* Share Link */}
          <button
            onClick={() => navigate("/share")}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaShare className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>

          {/* Users Link */}
          <button
            onClick={() => navigate("/users")}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaUsers className="w-4 h-4" />
            <span className="text-sm font-medium">Users</span>
          </button>

          {/* Users Permission Link */}
          <button
            onClick={() => navigate("/users/permission")}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaUsers className="w-4 h-4" />
            <span className="text-sm font-medium">Users/Permission</span>
          </button>

          {/* Profile Section - Clickable to navigate to settings */}
          <div
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {userName}
              </div>
              <div className="text-xs text-gray-500">{userEmail}</div>
            </div>
            {userPicture ? (
              <img
                src={userPicture}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DirectoryHeader;
