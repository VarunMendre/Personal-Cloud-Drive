import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaFolderPlus, FaUpload, FaShare, FaUsers } from "react-icons/fa";

// Use a constant for the API base URL
export const BASE_URL = import.meta.env.VITE_BASE_URL;

function DirectoryHeader({
  directoryName,
  path,
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
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
<<<<<<< HEAD
    <header className="flex flex-wrap justify-between items-center border-b-2 border-[#ccc] py-[10px] sticky top-0 z-10 bg-white">
      <div className="flex items-center">
        {path && path.length > 0 ? (
          path.map((dir, index) => (
            <span key={dir._id} className="flex items-center">
              <span
                className="cursor-pointer text-blue-500 hover:underline"
                onClick={() => navigate(`/directory/${dir._id}`)}
              >
                {index === 0 ? "My Drive" : dir.name}
              </span>
              {index < path.length - 1 && (
                <span className="mx-[5px] text-gray-500">/</span>
              )}
            </span>
          ))
        ) : (
          <h1 className="m-0 mr-5 text-[2rem] rounded-[4px]">My Drive</h1>
        )}
        {path && path.length > 0 && (
          <>
            <span className="mx-[5px] text-gray-500">/</span>
            <span className="text-gray-700">{directoryName}</span>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-[10px]">
        {/* Create Folder (icon button) */}
        <button
          className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3] disabled:opacity-50"
          title="Create Folder"
          onClick={onCreateFolderClick}
          disabled={disabled}
        >
          <FaFolderPlus />
        </button>

        {/* Upload Files (icon button) */}
        <button
          className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3] disabled:opacity-50"
          title="Upload Files"
          onClick={onUploadFilesClick}
          disabled={disabled}
        >
          <FaUpload />
        </button>
=======
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: Logo + Breadcrumb */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Storage
            </span>
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
                My Drive
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
>>>>>>> backup/branch

        {/* Right side: Navigation Links + Profile */}
        <div className="flex items-center gap-6">
          {/* Share Link */}
          <button
<<<<<<< HEAD
            className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3]"
            title="Settings"
            onClick={handleSettings}
=======
            onClick={() => navigate("/share")}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
>>>>>>> backup/branch
          >
            <FaShare className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>

          {/* Users Link */}
          <button
<<<<<<< HEAD
            className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3]"
            title="Shared with Me"
            onClick={() => navigate("/shared-with-me")}
=======
            onClick={() => navigate("/users")}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
>>>>>>> backup/branch
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          style={{ display: "none" }}
          multiple
          onChange={handleFileSelect}
        />
<<<<<<< HEAD

        {/* User Icon & Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3]"
            title="User Menu"
            onClick={handleUserIconClick}
          >
            {userPicture ? (
              <img
                className="w-[25px] h-[25px] border border-gray-500 rounded-full hover:p-[2px] object-cover"
                src={userPicture}
                alt={userName}
              />
            ) : (
              <FaUser />
            )}
          </button>

          {showUserMenu && (
            <div className="absolute top-[28px] right-0 bg-white border border-[#ddd] rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.15)] z-[999] min-w-[150px]">
              {loggedIn ? (
                <>
                  {/* Display name & email if logged in */}
                  <div className="flex flex-col gap-1 px-4 py-2 cursor-auto text-[#333] text-[0.95rem] whitespace-nowrap">
                    <span className="font-semibold text-[#222]">{userName}</span>
                    <span className="text-[0.85rem] text-[#555]">{userEmail}</span>
                  </div>

                  {/* Storage Usage Progress Bar */}
                  <div
                    className="flex flex-col gap-1 px-4 py-2 cursor-default text-[#333] text-[0.95rem] whitespace-nowrap"
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "#e5e7eb",
                        borderRadius: "9999px",
                        overflow: "hidden",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: `${(usedGB / totalGB) * 100}%`,
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          borderRadius: "9999px",
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {usedGB.toFixed(2)} GB of {totalGB.toFixed(2)} GB used
                    </div>
                  </div>

                  <div className="border-t border-[#eaeaea]" />
                  <div
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer text-[#333] text-[0.95rem] whitespace-nowrap hover:bg-[#e9e9e9]"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="text-[1rem] text-[#007bff]" />
                    <span>Logout</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer text-[#333] text-[0.95rem] whitespace-nowrap hover:bg-[#e9e9e9]"
                    onClick={handleLogoutAll}
                  >
                    <FaSignOutAlt className="text-[1rem] text-[#007bff]" />
                    <span>Logout All</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Show Login if not logged in */}
                  <div
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer text-[#333] text-[0.95rem] whitespace-nowrap hover:bg-[#e9e9e9]"
                    onClick={() => {
                      navigate("/login");
                      setShowUserMenu(false);
                    }}
                  >
                    <FaSignInAlt className="text-[1rem] text-[#007bff]" />
                    <span>Login</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
=======
>>>>>>> backup/branch
      </div>
    </header>
  );
}

export default DirectoryHeader;
