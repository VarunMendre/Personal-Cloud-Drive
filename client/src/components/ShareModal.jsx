import { useState, useEffect } from "react";
import {
  FaTimes,
  FaLink,
  FaCopy,
  FaTrash,
  FaEdit,
  FaEye,
  FaGlobe,
  FaShare,
  FaUserPlus,
} from "react-icons/fa";

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
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-700">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaShare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Share</h3>
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md" title={resourceName}>"{resourceName}"</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Share with specific user */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaUserPlus className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Add People</h4>
            </div>
            <form onSubmit={handleShareWithUser} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-900"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-900"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="submit"
                disabled={isSharing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSharing ? "Sharing..." : "Share"}
              </button>
            </form>
          </div>

          {/* People with access */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">People with Access</h4>
            <div className="space-y-2">
              {/* Owner */}
              {owner && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={owner.picture}
                    alt={owner.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{owner.name}</div>
                    <div className="text-xs text-gray-500 truncate">{owner.email}</div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Owner
                  </span>
                </div>
              )}

              {/* Shared users */}
              {sharedUsers.map((user) => (
                <div key={user.userId} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateAccess(user.userId, e.target.value)}
                    className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={() => handleRemoveAccess(user.userId)}
                    title="Remove access"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {sharedUsers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Not shared with anyone yet</p>
              )}
            </div>
          </div>

          {/* Share link section */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <FaGlobe className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-900">Get Link</h4>
            </div>
            {shareLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FaLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={shareLink.url}
                    readOnly
                    className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    title="Copy link"
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <FaCopy className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FaCopy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={shareLink.role}
                    onChange={(e) => handleUpdateLinkRole(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Anyone with link can view</option>
                    <option value="editor">Anyone with link can edit</option>
                  </select>
                  <button
                    onClick={handleDisableLink}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Disable
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Create a shareable link for this {resourceType}</p>
                <div className="flex gap-2">
                  <select
                    value={linkRole}
                    onChange={(e) => setLinkRole(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleGenerateLink}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaLink className="w-4 h-4" />
                    Generate Link
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Permission descriptions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Permission Levels</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FaEye className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong className="text-gray-900">Viewer:</strong>
                  <span className="text-gray-600"> Can view and download</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FaEdit className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong className="text-gray-900">Editor:</strong>
                  <span className="text-gray-600"> Can view, download, edit, and delete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;

