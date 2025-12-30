import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Link,
  Copy,
  Trash2,
  Eye,
  Globe,
  UserCheck,
  Users,
  Pencil,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Alert, AlertDescription } from "./components/lightswind/alert";
import DirectoryHeader from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function ManagePermissionsPage() {
  const { user } = useAuth();
  const { resourceType, resourceId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("shareLink");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Data State
  const [owner, setOwner] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [shareLink, setShareLink] = useState(null);
  const [linkRole, setLinkRole] = useState("viewer");
  const [linkEnabled, setLinkEnabled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch shared users and link info
  useEffect(() => {
    fetchSharedInfo();
  }, [resourceType, resourceId]);

  const fetchSharedInfo = async () => {
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
        setError(data.error || "Failed to fetch sharing info");
      }
    } catch (err) {
      console.error("Error fetching info:", err);
      setError("Error loading permission settings");
    } finally {
      setLoading(false);
    }
  };

  // --- Link Management Logic ---

  const handleToggleLink = async () => {
    if (!linkEnabled) {
      await handleGenerateLink();
    } else {
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
        setSuccess("Link permission updated!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update link");
      }
    } catch (err) {
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

  // --- User Access Management Logic ---

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
        fetchSharedInfo(); // Refresh list
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update access");
      }
    } catch (err) {
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
        fetchSharedInfo();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to remove access");
      }
    } catch (err) {
      setError("Error removing access");
    }
  };


  if (error && !owner) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" withIcon className="max-w-md bg-white shadow-xl p-8 text-center ring-1 ring-red-100">
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <div className="text-xl font-bold text-gray-900 mb-2">Error</div>
              <AlertDescription className="text-gray-600 mb-6">{error}</AlertDescription>
              <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Go Back</button>
            </div>
          </Alert>
        </div>
    );
  }

  return (
    <div className="min-h-screen font-sans pt-20">
      <DirectoryHeader
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture || ""}
        userRole={user?.role || "User"}
        subscriptionId={user?.subscriptionId}
        subscriptionStatus={user?.subscriptionStatus || "active"}
      />
      {/* Navbar / Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft className="w-5 h-5"/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Manage Permissions</h1>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                         {loading ? "Loading..." : "File Settings"}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        

        {/* Alerts */}
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

        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar / Tabs */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => setActiveTab("shareLink")}
                        className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-medium transition-colors border-l-4 ${
                            activeTab === "shareLink"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        <Link className="w-4 h-4" />
                        Share Link
                    </button>
                    <button
                        onClick={() => setActiveTab("sharedWith")}
                        className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-medium transition-colors border-l-4 ${
                            activeTab === "sharedWith"
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Shared With
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex justify-center p-12">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
                        
                        {/* Share Link Settings */}
                        {activeTab === "shareLink" && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-1">Link Sharing</h2>
                                    <p className="text-gray-500 text-sm">Manage public link access for this file.</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Enable Link Sharing</h4>
                                            <p className="text-xs text-gray-500">Allow anyone with the link to view</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleToggleLink}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            linkEnabled ? "bg-blue-600" : "bg-gray-300"
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            linkEnabled ? "translate-x-6" : "translate-x-1"
                                        }`} />
                                    </button>
                                </div>

                                {linkEnabled && shareLink && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Access Level
                                            </label>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleUpdateLinkRole("viewer")}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                                        linkRole === "viewer"
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                    }`}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="font-medium">Viewer</span>
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateLinkRole("editor")}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                                        linkRole === "editor"
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                                    }`}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    <span className="font-medium">Editor</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Copy Link
                                            </label>
                                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    value={shareLink.url}
                                                    readOnly
                                                    className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:outline-none"
                                                />
                                                <button
                                                    onClick={handleCopyLink}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    {copiedLink ? "Copied!" : "Copy"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Shared With List Settings */}
                        {activeTab === "sharedWith" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-1">People with Access</h2>
                                    <p className="text-gray-500 text-sm">Manage individual user permissions.</p>
                                </div>

                                {sharedUsers.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserCheck className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users shared yet</h3>
                                        <p className="text-sm text-gray-500 px-4">
                                            Invite people via email from the main dashboard to see them here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                                        {sharedUsers.map((user) => (
                                            <div key={user.userId} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                                {user.picture ? (
                                                    <img
                                                        src={user.picture}
                                                        alt={user.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateAccess(user.userId, e.target.value)}
                                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer hover:border-blue-400 transition-colors"
                                                    >
                                                        <option value="viewer">Viewer</option>
                                                        <option value="editor">Editor</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleRemoveAccess(user.userId)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Access"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default ManagePermissionsPage;
