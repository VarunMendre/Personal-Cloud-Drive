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
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] animate-[fadeIn_0.2s_ease]">
        <div className="bg-white rounded-xl w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.2)] animate-[slideUp_0.3s_ease]">
          <div className="text-center py-10 text-[#666]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] animate-[fadeIn_0.2s_ease]" onClick={onClose}>
      <div className="bg-white rounded-xl w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.2)] animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#e0e0e0]">
          <h2 className="text-xl m-0 text-[#333]">Share "{resourceName}"</h2>
          <button className="bg-transparent border-none text-xl text-[#666] cursor-pointer p-2 rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {error && <div className="mx-6 my-4 px-4 py-3 bg-[#fee] text-[#c33] rounded-lg border-l-4 border-[#c33]">{error}</div>}
        {success && <div className="mx-6 my-4 px-4 py-3 bg-[#efe] text-[#3c3] rounded-lg border-l-4 border-[#3c3]">{success}</div>}

        {/* Share with specific user */}
        <div className="px-6 py-5 border-b border-[#e0e0e0]">
          <h3 className="text-base m-0 mb-4 text-[#333] flex items-center gap-2">Add people</h3>
          <form onSubmit={handleShareWithUser} className="flex gap-2 items-center max-[600px]:flex-col">
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-[14px] py-[10px] border-2 border-[#e0e0e0] rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:border-[#667eea] max-[600px]:w-full"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-[14px] py-[10px] border-2 border-[#e0e0e0] rounded-lg text-sm cursor-pointer bg-white max-[600px]:w-full"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button type="submit" disabled={isSharing} className="px-6 py-[10px] bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-lg font-semibold cursor-pointer transition-transform duration-200 hover:not(:disabled):-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none max-[600px]:w-full">
              {isSharing ? "Sharing..." : "Share"}
            </button>
          </form>
        </div>

        {/* People with access */}
        <div className="px-6 py-5 border-b border-[#e0e0e0]">
          <h3 className="text-base m-0 mb-4 text-[#333] flex items-center gap-2">People with access</h3>
          <div className="flex flex-col gap-3">
            {/* Owner */}
            {owner && (
              <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] rounded-lg transition-colors duration-200 hover:bg-[#f0f0f0]">
                <img
                  src={owner.picture}
                  alt={owner.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-semibold text-[#333] text-sm">{owner.name}</div>
                  <div className="text-[#666] text-[13px]">{owner.email}</div>
                </div>
                <div className="px-3 py-[6px] rounded-md text-[13px] font-semibold bg-[#e3f2fd] text-[#1976d2]">Owner</div>
              </div>
            )}

            {/* Shared users */}
            {sharedUsers.map((user) => (
              <div key={user.userId} className="flex items-center gap-3 p-3 bg-[#f9f9f9] rounded-lg transition-colors duration-200 hover:bg-[#f0f0f0]">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-semibold text-[#333] text-sm">{user.name}</div>
                  <div className="text-[#666] text-[13px]">{user.email}</div>
                </div>
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleUpdateAccess(user.userId, e.target.value)
                  }
                  className="px-[10px] py-[6px] border border-[#e0e0e0] rounded-md text-[13px] cursor-pointer bg-white"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  className="p-2 bg-transparent border-none text-[#999] cursor-pointer rounded-md transition-all duration-200 hover:bg-[#ffebee] hover:text-[#c33]"
                  onClick={() => handleRemoveAccess(user.userId)}
                  title="Remove access"
                >
                  <FaTrash />
                </button>
              </div>
            ))}

            {sharedUsers.length === 0 && (
              <p className="text-center text-[#999] py-5 italic">Not shared with anyone yet</p>
            )}
          </div>
        </div>

        {/* Share link section */}
        <div className="px-6 py-5 border-b border-[#e0e0e0]">
          <h3 className="text-base m-0 mb-4 text-[#333] flex items-center gap-2">
            <FaGlobe /> Get Link
          </h3>
          {shareLink ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 p-3 bg-[#f9f9f9] rounded-lg">
                <FaLink className="text-[#667eea] text-lg" />
                <input
                  type="text"
                  value={shareLink.url}
                  readOnly
                  className="flex-1 border-none bg-transparent text-[13px] text-[#333] outline-none"
                />
                <button
                  className="px-4 py-2 bg-[#667eea] text-white border-none rounded-md cursor-pointer text-[13px] transition-all duration-200 hover:bg-[#5568d3]"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copiedLink ? "Copied!" : <FaCopy />}
                </button>
              </div>
              <div className="flex gap-2 items-center max-[600px]:flex-col">
                <select
                  value={shareLink.role}
                  onChange={(e) => handleUpdateLinkRole(e.target.value)}
                  className="px-[10px] py-[6px] border border-[#e0e0e0] rounded-md text-[13px] cursor-pointer bg-white max-[600px]:w-full"
                >
                  <option value="viewer">Anyone with link can view</option>
                  <option value="editor">Anyone with link can edit</option>
                </select>
                <button
                  className="px-4 py-2 bg-[#f44336] text-white border-none rounded-md cursor-pointer text-[13px] transition-all duration-200 hover:bg-[#d32f2f] max-[600px]:w-full"
                  onClick={handleDisableLink}
                >
                  Disable Link
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-[#666] mb-4">Create a shareable link for this {resourceType}</p>
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value)}
                className="px-[14px] py-[10px] border-2 border-[#e0e0e0] rounded-lg text-sm cursor-pointer bg-white"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                className="px-6 py-[10px] bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white border-none rounded-lg font-semibold cursor-pointer inline-flex items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 ml-2"
                onClick={handleGenerateLink}
              >
                <FaLink /> Generate Link
              </button>
            </div>
          )}
        </div>

        {/* Permission descriptions */}
        <div className="px-6 py-4 bg-[#f9f9f9] rounded-b-xl">
          <h4 className="text-sm m-0 mb-3 text-[#333]">Permission levels:</h4>
          <div className="flex items-center gap-3 mb-2 text-[13px] text-[#666]">
            <FaEye className="text-[#667eea] text-base" />
            <div>
              <strong>Viewer:</strong> Can view and download
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2 text-[13px] text-[#666]">
            <FaEdit className="text-[#667eea] text-base" />
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
