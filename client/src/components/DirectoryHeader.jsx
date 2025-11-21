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
  // 1. Fetch user info from /user on mount
  // -------------------------------------------
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${BASE_URL}/user`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          // Set user info if logged in
          setUserName(data.name);
          setUserEmail(data.email);
          setMaxStorageLimit(data.maxStorageLimit);
          setUserPicture(data.picture)
          setUsedStorageInBytes(data.usedStorageInBytes);
          setLoggedIn(true);
        } else if (response.status === 401) {
          // User not logged in
          setUserName("Guest User");
          setUserEmail("guest@example.com");
          setLoggedIn(false);
        } else {
          // Handle other error statuses if needed
          console.error("Error fetching user info:", response.status);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }
    fetchUser();
  }, []);

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
    <header className="directory-header">
      <div className="breadcrumb">
        {path && path.length > 0 ? (
          path.map((dir, index) => (
            <span key={dir._id}>
              <span
                className="breadcrumb-item"
                onClick={() => navigate(`/directory/${dir._id}`)}
                style={{ cursor: "pointer", color: "#3b82f6" }}
              >
                {index === 0 ? "My Drive" : dir.name}
              </span>
              {index < path.length - 1 && <span style={{ margin: "0 5px" }}>/</span>}
            </span>
          ))
        ) : (
          <h1>My Drive</h1>
        )}
        {path && path.length > 0 && (
             <>
                <span style={{ margin: "0 5px" }}>/</span>
                <span>{directoryName}</span>
             </>
        )}
      </div>
      <div className="header-links">
        {/* Create Folder (icon button) */}
        <button
          className="icon-button"
          title="Create Folder"
          onClick={onCreateFolderClick}
          disabled={disabled}
        >
          <FaFolderPlus />
        </button>

        {/* Upload Files (icon button) */}
        <button
          className="icon-button"
          title="Upload Files"
          onClick={onUploadFilesClick}
          disabled={disabled}
        >
          <FaUpload />
        </button>

        {/* Settings Icon - Only show when logged in */}
        {loggedIn && (
          <button
            className="icon-button"
            title="Settings"
            onClick={handleSettings}
          >
            <FaCog />
          </button>
        )}

        {/* Shared with Me - Only show when logged in */}
        {loggedIn && (
          <button
            className="icon-button"
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
        <div className="user-menu-container" ref={userMenuRef}>
          <button
            className="icon-button"
            title="User Menu"
            onClick={handleUserIconClick}
          >
            {userPicture ? (
              <img className="userPicture" src={userPicture} alt={userName} />
            ) : (
              <FaUser />
            )}
          </button>

          {showUserMenu && (
            <div className="user-menu">
              {loggedIn ? (
                <>
                  {/* Display name & email if logged in */}
                  <div className="user-menu-item user-info">
                    <span className="user-name">{userName}</span>
                    <span className="user-email">{userEmail}</span>
                  </div>

                  {/* Storage Usage Progress Bar */}
                  <div
                    className="user-menu-item storage-info"
                    style={{ padding: "8px 16px", cursor: "default" }}
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
                      {usedGB.toFixed(2)} GB of {totalGB} GB used
                    </div>
                  </div>

                  <div className="user-menu-divider" />
                  <div
                    className="user-menu-item login-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="menu-item-icon" />
                    <span>Logout</span>
                  </div>
                  <div
                    className="user-menu-item login-btn"
                    onClick={handleLogoutAll}
                  >
                    <FaSignOutAlt className="menu-item-icon" />
                    <span>Logout All</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Show Login if not logged in */}
                  <div
                    className="user-menu-item login-btn"
                    onClick={() => {
                      navigate("/login");
                      setShowUserMenu(false);
                    }}
                  >
                    <FaSignInAlt className="menu-item-icon" />
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
