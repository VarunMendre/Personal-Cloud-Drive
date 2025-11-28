import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFolderPlus,
  FaUpload,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaCog,
  FaUserFriends, // Shared with me icon
} from "react-icons/fa";

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
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("guest@example.com");
  const [userPicture, setUserPicture] = useState("");
  const [maxStorageLimit, setMaxStorageLimit] = useState(1073741824);
  const [usedStorageInBytes, setUsedStorageInBytes] = useState(0);

  // Storage stats
  const usedGB = usedStorageInBytes / 1024 ** 3;
  const totalGB = maxStorageLimit / 1024 ** 3;

  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // -------------------------------------------
  // 1. Fetch user info - moved outside useEffect
  // -------------------------------------------
  const fetchUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
        setUserEmail(data.email);
        setMaxStorageLimit(data.maxStorageLimit);
        setUserPicture(data.picture);
        setUsedStorageInBytes(data.usedStorageInBytes);
        setLoggedIn(true);
      } else if (response.status === 401) {
        setUserName("Guest User");
        setUserEmail("guest@example.com");
        setLoggedIn(false);
      } else {
        console.error("Error fetching user info:", response.status);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  // Call fetchUser on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Expose fetchUser to parent via callback
  useEffect(() => {
    if (onStorageUpdate) {
      onStorageUpdate(fetchUser);
    }
  }, [onStorageUpdate]);

  // -------------------------------------------
  // 2. Toggle user menu
  // -------------------------------------------
  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  // -------------------------------------------
  // 3. Logout handler
  // -------------------------------------------
  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("Logged out successfully");
        // Optionally reset local state
        setLoggedIn(false);
        setUserName("Guest User");
        setUserEmail("guest@example.com");
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/logout-all`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("Logged out successfully");
        // Optionally reset local state
        setLoggedIn(false);
        setUserName("Guest User");
        setUserEmail("guest@example.com");
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setShowUserMenu(false);
    }
  };

  // -------------------------------------------
  // 4. Navigate to settings
  // -------------------------------------------
  const handleSettings = () => {
    navigate("/settings");
    setShowUserMenu(false);
  };

  // -------------------------------------------
  // 5. Close menu on outside click
  // -------------------------------------------
  useEffect(() => {
    function handleDocumentClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  return (
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

        {/* Settings Icon - Only show when logged in */}
        {loggedIn && (
          <button
            className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3]"
            title="Settings"
            onClick={handleSettings}
          >
            <FaCog />
          </button>
        )}

        {/* Shared with Me - Only show when logged in */}
        {loggedIn && (
          <button
            className="bg-transparent border-none cursor-pointer text-[1.2rem] text-[#007bff] flex items-center justify-center hover:text-[#0056b3]"
            title="Shared with Me"
            onClick={() => navigate("/shared-with-me")}
          >
            <FaUserFriends />
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          style={{ display: "none" }}
          multiple
          onChange={handleFileSelect}
        />

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
      </div>
    </header>
  );
}

export default DirectoryHeader;
