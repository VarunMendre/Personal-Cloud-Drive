import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFolder, FaFile, FaEye, FaEdit, FaArrowLeft } from "react-icons/fa";
import "./SharedWithMe.css";

import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";

function SharedWithMe() {
  const navigate = useNavigate();
  const [directories, setDirectories] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userPicture, setUserPicture] = useState("");

  useEffect(() => {
    fetchSharedResources();
    fetchUser();
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
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

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
        setDirectories(data.directories);
        setFiles(data.files);
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
      <span className={`role-badge ${role}`}>
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
      <div className="shared-with-me-container">
        <div className="loading">Loading shared resources...</div>
      </div>
    );
  }

  const totalItems = directories.length + files.length;

  return (
    <>
      <DirectoryHeader
        directoryName="Shared with Me"
        path={[]}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
      />
      <div className="shared-with-me-container">
      <div className="shared-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          <FaArrowLeft /> Back to My Drive
        </button>
        <h1>Shared with Me</h1>
        <p className="subtitle">
          {totalItems} {totalItems === 1 ? "item" : "items"} shared with you
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {totalItems === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h2>No shared items yet</h2>
          <p>Files and folders shared with you will appear here</p>
        </div>
      ) : (
        <div className="shared-content">
          {/* Shared Directories */}
          {directories.length > 0 && (
            <div className="shared-section">
              <h2>Folders</h2>
              <div className="items-grid">
                {directories.map((dir) => (
                  <div
                    key={dir.id}
                    className="shared-item"
                    onClick={() => handleDirectoryClick(dir.id)}
                  >
                    <div className="item-icon folder-icon">
                      <FaFolder />
                    </div>
                    <div className="item-details">
                      <h3 className="item-name">{dir.name}</h3>
                      <div className="item-meta">
                        <span className="owner">
                          Shared by {dir.owner.name}
                        </span>
                        <span className="shared-date">
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
            <div className="shared-section">
              <h2>Files</h2>
              <div className="items-grid">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="shared-item"
                    onClick={() => handleFileClick(file.id)}
                  >
                    <div className="item-icon file-icon">
                      <FaFile />
                    </div>
                    <div className="item-details">
                      <h3 className="item-name">{file.name}</h3>
                      <div className="item-meta">
                        <span className="owner">
                          Shared by {file.owner.name}
                        </span>
                        <span className="shared-date">
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
