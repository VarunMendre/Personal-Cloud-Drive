import { useState, useEffect } from "react";
import {
  FaTimes,
  FaLink,
  FaCopy,
  FaTrash,
  FaEdit,
  FaEye,
  FaGlobe,
} from "react-icons/fa";
import "./ShareModal.css";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function ShareModal({ resourceType, resourceId, resourceName, onClose }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [owner, setOwner] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [linkRole, setLinkRole] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch shared users on mount
  useEffect(() => {
    fetchSharedUsers();
  }, []);

  const fetchSharedUsers = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/shared-users`,
        { credentials: "include" }
      );

      if (response.ok) {
        const data = await response.json();
        setOwner(data.owner);
        setSharedUsers(data.sharedWith);
        setShareLink(data.shareLink);
        if (data.shareLink) {
          setLinkRole(data.shareLink.role);
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch shared users");
      }
    } catch (err) {
      console.error("Error fetching shared users:", err);
      setError("Error loading sharing information");
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    setIsSharing(true);

    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, role }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Shared with ${email} successfully!`);
        setEmail("");
        setRole("viewer");
        fetchSharedUsers(); // Refresh list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to share");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      setError("Error sharing resource");
    } finally {
      setIsSharing(false);
    }
  };

  const handleUpdateAccess = async (userId, newRole) => {
    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/share/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        setSuccess("Access level updated!");
        fetchSharedUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update access");
      }
    } catch (err) {
      console.error("Error updating access:", err);
      setError("Error updating access level");
    }
  };

  const handleRemoveAccess = async (userId) => {
    if (!confirm("Are you sure you want to remove this user's access?")) {
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/share/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setSuccess("Access removed successfully!");
        fetchSharedUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to remove access");
      }
    } catch (err) {
      console.error("Error removing access:", err);
      setError("Error removing access");
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/share-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: linkRole }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShareLink(data.shareLink);
        setSuccess("Share link generated!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to generate link");
      }
    } catch (err) {
      console.error("Error generating link:", err);
      setError("Error generating share link");
    }
  };

  const handleUpdateLinkRole = async (newRole) => {
    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/share-link`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        setLinkRole(newRole);
        setShareLink({ ...shareLink, role: newRole });
        setSuccess("Link permission updated!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update link");
      }
    } catch (err) {
      console.error("Error updating link:", err);
      setError("Error updating share link");
    }
  };

  const handleDisableLink = async () => {
    if (!confirm("Are you sure you want to disable this share link?")) {
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/share/${resourceType}/${resourceId}/share-link`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setShareLink(null);
        setSuccess("Share link disabled!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disable link");
      }
    } catch (err) {
      console.error("Error disabling link:", err);
      setError("Error disabling share link");
    }
  };

  const handleCopyLink = () => {
    if (shareLink?.url) {
      navigator.clipboard.writeText(shareLink.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="share-modal-overlay">
        <div className="share-modal">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share "{resourceName}"</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Share with specific user */}
        <div className="share-section">
          <h3>Add people</h3>
          <form onSubmit={handleShareWithUser} className="share-form">
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="role-select"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button type="submit" disabled={isSharing} className="share-btn">
              {isSharing ? "Sharing..." : "Share"}
            </button>
          </form>
        </div>

        {/* People with access */}
        <div className="share-section">
          <h3>People with access</h3>
          <div className="users-list">
            {/* Owner */}
            {owner && (
              <div className="user-item">
                <img
                  src={owner.picture}
                  alt={owner.name}
                  className="user-avatar"
                />
                <div className="user-info">
                  <div className="user-name">{owner.name}</div>
                  <div className="user-email">{owner.email}</div>
                </div>
                <div className="user-role owner-badge">Owner</div>
              </div>
            )}

            {/* Shared users */}
            {sharedUsers.map((user) => (
              <div key={user.userId} className="user-item">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="user-avatar"
                />
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleUpdateAccess(user.userId, e.target.value)
                  }
                  className="role-select-small"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveAccess(user.userId)}
                  title="Remove access"
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            {sharedUsers.length === 0 && (
              <p className="no-users">Not shared with anyone yet</p>
            )}
          </div>
        </div>

        {/* Share link section */}
        <div className="share-section">
          <h3>
            <FaGlobe /> Get Link
          </h3>
          {shareLink ? (
            <div className="link-section">
              <div className="link-display">
                <FaLink className="link-icon" />
                <input
                  type="text"
                  value={shareLink.url}
                  readOnly
                  className="link-input"
                />
                <button
                  className="copy-btn"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copiedLink ? "Copied!" : <FaCopy />}
                </button>
              </div>
              <div className="link-controls">
                <select
                  value={shareLink.role}
                  onChange={(e) => handleUpdateLinkRole(e.target.value)}
                  className="role-select-small"
                >
                  <option value="viewer">Anyone with link can view</option>
                  <option value="editor">Anyone with link can edit</option>
                </select>
                <button
                  className="disable-link-btn"
                  onClick={handleDisableLink}
                >
                  Disable Link
                </button>
              </div>
            </div>
          ) : (
            <div className="no-link">
              <p>Create a shareable link for this {resourceType}</p>
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value)}
                className="role-select"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                className="generate-link-btn"
                onClick={handleGenerateLink}
              >
                <FaLink /> Generate Link
              </button>
            </div>
          )}
        </div>

        {/* Permission descriptions */}
        <div className="permissions-info">
          <h4>Permission levels:</h4>
          <div className="permission-item">
            <FaEye className="permission-icon" />
            <div>
              <strong>Viewer:</strong> Can view and download
            </div>
          </div>
          <div className="permission-item">
            <FaEdit className="permission-icon" />
            <div>
              <strong>Editor:</strong> Can view, download, edit, and delete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
