import { useState, useEffect } from "react";
import {
  FaTimes,
  FaLink,
  FaCopy,
  FaTrash,
  FaEye,
  FaGlobe,
  FaShare,
  FaEnvelope,
  FaUsers,
  FaPencilAlt,
  FaUserCheck,
} from "react-icons/fa";
import { Alert, AlertDescription } from "./lightswind/alert";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function ShareModal({ resourceType, resourceId, resourceName, onClose }) {
  const [activeTab, setActiveTab] = useState("shareLink");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [owner, setOwner] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [linkRole, setLinkRole] = useState("viewer");
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // For Email Invite tab - user selection
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch shared users on mount or when resource changes
  useEffect(() => {
    if (resourceType && resourceId) {
      fetchSharedUsers();
    } else {
      setLoading(false);
    }
    fetchAllUsers();
  }, [resourceType, resourceId]);

  const fetchSharedUsers = async () => {
    setLoading(true);
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
        if (data.shareLink && data.shareLink.enabled) {
          setLinkRole(data.shareLink.role);
          setLinkEnabled(true);
        } else {
             setLinkEnabled(false);
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



  const fetchAllUsers = async () => {
    try {
      // Correct endpoint for user list
      const response = await fetch(`${BASE_URL}/list`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Safety check to ensure data is an array
        if (Array.isArray(data)) {
          setAllUsers(data);
        } else {
          console.error("User list is not an array:", data);
          setAllUsers([]);
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
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
        fetchSharedUsers();
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

  const handleToggleLink = async () => {
    if (!linkEnabled) {
      // Generate link
      await handleGenerateLink();
    } else {
      // Disable link
      await handleDisableLink();
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
        setLinkEnabled(true);
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
        setLinkEnabled(false);
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

  const handleUserSelect = (user) => {
    if (selectedUsers.find((u) => u.userId === user.userId)) {
      setSelectedUsers(selectedUsers.filter((u) => u.userId !== user.userId));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) {
      setError("Please select users to invite");
      return;
    }

    setIsSharing(true);
    setError("");
    setSuccess("");

    try {
      // Send invites to all selected users
      const promises = selectedUsers.map((user) =>
        fetch(`${BASE_URL}/share/${resourceType}/${resourceId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email, role: "viewer" }),
        })
      );

      await Promise.all(promises);
      setSuccess(`Invites sent to ${selectedUsers.length} user(s)!`);
      setSelectedUsers([]);
      await fetchSharedUsers();
      setActiveTab("sharedWith");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error sending invites:", err);
      setError("Error sending invites");
    } finally {
      setIsSharing(false);
    }
  };

  const filteredUsers = Array.isArray(allUsers) 
    ? allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];



  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <FaUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Share Document</h3>
              <p className="text-sm text-gray-500 mt-0.5">Collaborate with others</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab("shareLink")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === "shareLink"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaLink className="w-4 h-4" />
            Share Link
          </button>
          <button
            onClick={() => setActiveTab("emailInvite")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === "emailInvite"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaEnvelope className="w-4 h-4" />
            Email Invite
          </button>
          <button
            onClick={() => setActiveTab("sharedWith")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === "sharedWith"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaUserCheck className="w-4 h-4" />
            Shared With
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

          {/* Messages */}
          {error && (
            <div className="fixed top-24 right-6 z-[100] max-w-sm w-full md:w-[380px]">
              <Alert variant="destructive" withIcon duration={4000} dismissible onDismiss={() => setError("")} className="bg-white/95 backdrop-blur-md shadow-2xl border-red-100">
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {success && (
            <div className="fixed top-24 right-6 z-[100] max-w-sm w-full md:w-[380px]">
              <Alert variant="success" withIcon duration={3000} dismissible onDismiss={() => setSuccess("")} className="bg-white/95 backdrop-blur-md shadow-2xl border-green-100">
                <AlertDescription className="font-semibold">{success}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Share Link Tab */}
          {activeTab === "shareLink" && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Toggle Share Link */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaGlobe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Share with link</h4>
                        <p className="text-xs text-gray-500">Anyone with the link can access</p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleLink}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        linkEnabled ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          linkEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {linkEnabled && shareLink && (
                    <>
                      {/* Permission Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Permission level
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateLinkRole("viewer")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                              linkRole === "viewer"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <FaEye className="w-4 h-4" />
                            <span className="font-medium">Viewer</span>
                          </button>
                          <button
                            onClick={() => handleUpdateLinkRole("editor")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                              linkRole === "editor"
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <FaPencilAlt className="w-4 h-4" />
                            <span className="font-medium">Editor</span>
                          </button>
                        </div>
                      </div>

                      {/* Share Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Share link
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FaLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={shareLink.url}
                            readOnly
                            className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                          />
                          <button
                            onClick={handleCopyLink}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FaCopy className="w-3 h-3" />
                            {copiedLink ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Email Invite Tab */}
          {activeTab === "emailInvite" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select users to invite
                </label>
                <input
                  type="text"
                  placeholder="Choose users to invite"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-gray-900"
                />
              </div>

              {/* User List */}
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.find((u) => u.userId === user.userId);
                  return (
                    <div
                      key={user.userId}
                      onClick={() => handleUserSelect(user)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Send Invites Button */}
              <button
                onClick={handleSendInvites}
                disabled={selectedUsers.length === 0 || isSharing}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSharing
                  ? "Sending..."
                  : selectedUsers.length > 0
                  ? "Send Invites"
                  : "Select users to send invites"}
              </button>
            </div>
          )}

          {/* Shared With Tab */}
          {activeTab === "sharedWith" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaUserCheck className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Users with Access</h4>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : sharedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUserCheck className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users shared yet</h3>
                  <p className="text-sm text-gray-500">
                    Use the Email Invite tab to share this document with others.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sharedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </div>
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
