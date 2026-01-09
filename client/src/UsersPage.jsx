import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Trash2,
  Pencil,
  Eye,
  LogOut,
  RotateCcw,
  AlertTriangle,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Download,
  Zap,
  Pause,
  Play,
  RefreshCw,
  MoreVertical,
  Mail,
  User,
  Shield,
  Search,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription } from "./components/lightswind/alert";

export default function UsersPage() {
  const navigate = useNavigate();

  // --- State ---
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser, isAuthenticating } = useAuth();

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  
  // File Modals
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Toast notifications
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Selection
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [processingAction, setProcessingAction] = useState(null); // 'pause', 'resume', 'logout', 'delete', 'hardDelete', 'recover', 'roleChange'

  // Data

  // --- Effects ---
  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Fetching ---

  async function fetchUsers() {
    setIsLoading(true);
    try {
      // Fetch all required data in parallel to avoid "waterfall" loading
      const [usersResponse, permResponse, meResponse] = await Promise.all([
        fetch(`${BASE_URL}/users`, { credentials: "include" }),
        fetch(`${BASE_URL}/users/permission`, { credentials: "include" }).catch(err => {
          console.warn("Could not fetch permission data:", err);
          return { ok: false };
        }),
        fetch(`${BASE_URL}/user`, { credentials: "include" }).catch(err => {
          console.warn("Could not fetch my data:", err);
          return { ok: false };
        })
      ]);

      // Check for auth errors on the main users request
      if (usersResponse.status === 403) {
        navigate("/");
        return;
      }
      if (usersResponse.status === 401) {
        navigate("/login");
        return;
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        
        // Process optional data
        let permissionData = { users: [] };
        if (permResponse.ok) {
          try {
            permissionData = await permResponse.json();
          } catch (err) {
            console.warn("Error parsing permission data:", err);
          }
        }

        let myData = null;
        if (meResponse.ok) {
          try {
            myData = await meResponse.json();
          } catch (err) {
            console.warn("Error parsing my data:", err);
          }
        }
        
        // Create a map of roles from permission data
        const roleMap = {};
        if (permissionData.users && Array.isArray(permissionData.users)) {
          permissionData.users.forEach(u => {
            roleMap[u._id || u.id] = u.role;
            roleMap[u.email] = u.role;
          });
        }

        // Merge data
        const normalized = usersData.map((u) => {
          // 1. Check if this is ME
          const isMe = myData && (
            (myData.email && u.email === myData.email) || 
            (myData._id && u._id && u._id === myData._id) || 
            (myData.id && u.id && u.id === myData.id)
          );

          if (isMe) {
             return {
               ...u,
               role: myData.role, // Force correct role for self
               isLoggedIn: true, // I am definitely logged in
             };
          }

          // 2. Try permission map
          // 3. Fallback to existing role or "User"
          const role = roleMap[u._id || u.id] || roleMap[u.email] || u.role || "User";
          
          return {
            ...u,
            role: role,
            isLoggedIn:
              u.isLoggedIn === true ||
              u.isLoggedIn === "true" ||
              u.status === "online" ||
              u.active === true,
          };
        });

        setUsers(normalized);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // --- Helpers ---
  const getRoleColor = (role) => {
    switch (role) {
      case "Owner": return "bg-red-100 text-red-800";
      case "Admin": return "bg-orange-100 text-orange-800";
      case "Manager": return "bg-blue-100 text-blue-800";
      case "User": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (isLoggedIn, isDeleted) => {
    if (isDeleted) return "bg-red-100 text-red-800";
    if (isLoggedIn) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getRolePriority = (role) => {
    const priorities = { Owner: 1, Admin: 2, Manager: 3, User: 4 };
    return priorities[role] || 5;
  };

  const canChangeRole = (targetUser) => {
    if (currentUser.email === targetUser.email) return false;
    if (currentUser.role === "Owner") return true;
    const currentPriority = getRolePriority(currentUser.role);
    const targetPriority = getRolePriority(targetUser.role);
    return currentPriority <= targetPriority;
  };

  const getAvailableRolesForUser = (targetUserRole) => {
    const role = currentUser.role;
    if (role === "Owner") {
      return targetUserRole === "Owner" ? ["Owner"] : ["Admin", "Manager", "User"];
    } else if (role === "Admin") {
      // Admin can change role upto Admin (make new Admin, Manager)
      return ["Admin", "Manager", "User"];
    } else if (role === "Manager") {
      // Manager can change role to Manager or User
      return ["Manager", "User"];
    }
    return [];
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // --- Handlers ---
  
  // File Management
  const handleViewClick = (user) => {
    navigate(`/users/${user._id || user.id}/files`, { state: { user, currentUser } });
  };
  const handleRoleChangeClick = (user) => {
    setSelectedUser(user);
    setNewRole("");
    setShowRoleModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    setProcessingAction('roleChange');
    try {
      const response = await fetch(`${BASE_URL}/users/${selectedUser._id || selectedUser.id}/role`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        setShowRoleModal(false);
        fetchUsers();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to change role");
      }
    } catch (err) {
      console.error("Role change error:", err);
    } finally {
      setProcessingAction(null);
    }
  };

  // User Actions
  const handleLogoutClick = (user) => {
    setSelectedUser(user);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    if (!selectedUser) return;
    setProcessingAction('logout');
    try {
      const response = await fetch(`${BASE_URL}/users/${selectedUser.id}/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setShowLogoutModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSoftDelete = async () => {
    if (!selectedUser) return;
    setProcessingAction('delete');
    try {
      const response = await fetch(`${BASE_URL}/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setShowDeleteModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error("Soft delete error:", err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleHardDelete = async () => {
    if (!selectedUser) return;
    setProcessingAction('hardDelete');
    try {
      const response = await fetch(`${BASE_URL}/users/${selectedUser.id}/hard`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setShowHardDeleteConfirm(false);
        fetchUsers();
      }
    } catch (err) {
      console.error("Hard delete error:", err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRecoverClick = (user) => {
    setSelectedUser(user);
    setShowRecoverModal(true);
  };

  const confirmRecover = async () => {
    if (!selectedUser) return;
    setProcessingAction('recover');
    try {
      const response = await fetch(`${BASE_URL}/users/${selectedUser.id}/recover`, {
        method: "PUT",
        credentials: "include",
      });
      if (response.ok) {
        setShowRecoverModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error("Recover error:", err);
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePauseSubscription = (user) => {
    if (!user.razorpaySubscriptionId) {
      setErrorMessage("No active subscription found for this user");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    setSelectedUser(user);
    setShowPauseModal(true);
  };

  const confirmPause = async () => {
    if (!selectedUser) return;
    setProcessingAction('pause');
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/${selectedUser.razorpaySubscriptionId}/pause`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setShowPauseModal(false);
        setSuccessMessage("Subscription paused successfully");
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          window.location.reload();
        }, 3000);
        fetchUsers();
      } else {
        const err = await response.json();
        setShowPauseModal(false);
        setErrorMessage(err.message || "Failed to pause subscription");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (err) {
      console.error("Pause error:", err);
      setShowPauseModal(false);
      setErrorMessage("An error occurred while pausing subscription");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      setProcessingAction(null);
    }
  };

  const handleResumeSubscription = (user) => {
    if (!user.razorpaySubscriptionId) {
      setErrorMessage("No active subscription found for this user");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    setSelectedUser(user);
    setShowResumeModal(true);
  };

  const confirmResume = async () => {
    if (!selectedUser) return;
    setProcessingAction('resume');
    console.log("Resuming subscription for user:", selectedUser.name, "ID:", selectedUser.razorpaySubscriptionId);
    try {
      const response = await fetch(`${BASE_URL}/subscriptions/${selectedUser.razorpaySubscriptionId}/resume`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setShowResumeModal(false);
        setSuccessMessage("Subscription resumed successfully");
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          window.location.reload();
        }, 3000);
        fetchUsers();
      } else {
        const err = await response.json();
        setShowResumeModal(false);
        setErrorMessage(err.message || "Failed to resume subscription");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (err) {
      console.error("Resume error:", err);
      setShowResumeModal(false);
      setErrorMessage("An error occurred while resuming subscription");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      setProcessingAction(null);
    }
  };

  // --- Loading Check ---
  if (isAuthenticating || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- Permissions ---
  const canViewFiles = currentUser.role === "Owner" || currentUser.role === "Admin";
  const canDeleteFiles = currentUser.role === "Owner"; // Only Owner can delete files
  const canRenameFiles = currentUser.role === "Owner";

  // Filter users based on role
  const filteredUsers = users.filter(u => {
    if (currentUser.role === "Owner") return true;
    if (currentUser.role === "Admin") return u.role !== "Owner";
    if (currentUser.role === "Manager") return u.role !== "Owner" && u.role !== "Admin";
    return false;
  });

  // --- Stats ---
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter((u) => !u.isDeleted).length;
  const deletedUsers = filteredUsers.filter((u) => u.isDeleted).length;

  // Action Permissions
  const canLogoutUser = (targetUser) => {
    if (targetUser.isDeleted) return false;
    if (currentUser.role === "Owner") return true;
    if (currentUser.role === "Admin") return targetUser.role !== "Owner";
    return true; 
  };

  const canDeleteUser = (targetUser) => {
    if (currentUser.role === "Owner") return true;
    if (currentUser.role === "Admin") return true; // Admin can soft or hard delete
    return false; // Manager cannot delete
  };

  const canHardDeleteUser = (targetUser) => {
    if (currentUser.role === "Owner") return true;
    if (currentUser.role === "Admin") return true; // Admin can hard delete
    return false;
  };
  
  return (
    <div className="min-h-screen">
      <DirectoryHeader
        directoryName="Users"
        path={[]}
        userName={currentUser?.name || "Guest User"}
        userEmail={currentUser?.email || "guest@example.com"}
        userPicture={currentUser?.picture}
        userRole={currentUser?.role || "User"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-6">
        {/* Top Section: Back Button & User Info */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
              <div className="text-xs text-gray-500">{currentUser.email}</div>
            </div>
            {currentUser.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Active Users</p>
              <p className="text-xl font-bold text-gray-900">{activeUsers}</p>
            </div>
          </div>

          {/* Online Users */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Online Users</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.isLoggedIn && !u.isDeleted).length}
              </p>
            </div>
          </div>

          {/* Deleted Users */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Deleted Users</p>
              <p className="text-xl font-bold text-gray-900">{deletedUsers}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Users Management</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total users: {totalUsers} | Active: {activeUsers} | Deleted: {deletedUsers}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-6">
                <option>All Users</option>
              </select>
              <button 
                onClick={() => !processingAction && fetchUsers()}
                disabled={!!processingAction}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${processingAction ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-medium">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Storage Used</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  {currentUser.role === "Owner" && <th className="px-4 py-2">Subscription</th>}
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={currentUser.role === "Owner" ? "6" : "5"} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Users className="w-5 h-5 text-blue-400" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Fetching user data...</p>
                        <p className="text-xs text-gray-500">Retrieving users and permissions</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === "Owner" ? "6" : "5"} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                          <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">No users found</p>
                        <p className="text-xs text-gray-500">Try adjusting your filters or search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.picture ? (
                            <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatBytes(user.usedStorageInBytes || 0)}
                        </div>
                        <div className="text-xs text-gray-500">of {formatBytes(user.maxStorageLimit || 500 * 1024 * 1024)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                          {canChangeRole(user) && (
                            <button 
                              onClick={() => !processingAction && handleRoleChangeClick(user)}
                              disabled={!!processingAction}
                              className={`text-gray-400 hover:text-blue-600 transition-colors ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Change Role"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isLoggedIn, user.isDeleted)}`}>
                          {user.isDeleted ? "Deleted" : user.isLoggedIn ? "Logged In" : "Logged Out"}
                        </span>
                      </td>
                      {currentUser.role === "Owner" && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {user.razorpaySubscriptionId ? (
                              <>
                                {user.subscriptionStatus === "paused" ? (
                                    <button
                                      onClick={() => !processingAction && handleResumeSubscription(user)}
                                      disabled={!!processingAction}
                                      className={`p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1 shadow-sm ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Resume Subscription"
                                    >
                                      <Play className="w-3 h-3" />
                                      <span className="text-[10px] font-bold uppercase">Resume</span>
                                    </button>
                                ) : (
                                    <button
                                      onClick={() => !processingAction && handlePauseSubscription(user)}
                                      disabled={!!processingAction}
                                      className={`p-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all flex items-center gap-1 shadow-sm ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Pause Subscription"
                                    >
                                      <Pause className="w-3 h-3" />
                                      <span className="text-[10px] font-bold uppercase">Pause</span>
                                    </button>
                                )}
                                
                                {/* Status Label */}
                                <div className="flex items-center ml-1">
                                  {user.subscriptionStatus === "paused" ? (
                                    <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                       <AlertTriangle className="w-2.5 h-2.5 animate-pulse" />
                                       <span className="text-[9px] font-bold uppercase">Paused</span>
                                    </div>
                                  ) : user.subscriptionStatus === "active" ? (
                                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                       <CheckCircle className="w-2.5 h-2.5" />
                                       <span className="text-[9px] font-bold uppercase">Active</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-gray-400 opacity-60">
                                      <span className="text-[9px] font-medium italic">Basic Account</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400 opacity-60">
                                 <span className="text-[9px] font-medium italic">Basic Account</span>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Logout */}
                          {canLogoutUser(user) && !user.isDeleted && (
                            <button
                              onClick={() => !processingAction && handleLogoutClick(user)}
                              disabled={!user.isLoggedIn || !!processingAction}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.isLoggedIn && !processingAction
                                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              title="Logout User"
                            >
                              <span className="text-xs px-2">Logout</span>
                            </button>
                          )}
  
                          {/* Delete/Recover */}
                          {canDeleteUser(user) && (
                            <>
                              {!user.isDeleted ? (
                                <button
                                  onClick={() => !processingAction && handleDeleteClick(user)}
                                  disabled={user.email === currentUser.email || !!processingAction}
                                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              ) : (
                                canHardDeleteUser(user) && (
                                  <button
                                    onClick={() => !processingAction && handleRecoverClick(user)}
                                    disabled={!!processingAction}
                                    className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                    >
                                      Recover
                                    </button>
                                )
                              )}
                            </>
                          )}
  
                          {/* View Files */}
                          {canViewFiles && !user.isDeleted && (
                            <button
                              onClick={() => !processingAction && handleViewClick(user)}
                              disabled={!!processingAction}
                              className={`p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="View Files"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
              <p className="text-sm text-gray-500 mt-1">Update role for {selectedUser.name}</p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                {selectedUser.picture ? (
                  <img src={selectedUser.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{selectedUser.name}</div>
                  <div className="text-sm text-gray-500 truncate">{selectedUser.email}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                >
                  <option value="">Select a role</option>
                  {getAvailableRolesForUser(selectedUser.role).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  disabled={processingAction === 'roleChange'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={!newRole || processingAction === 'roleChange'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {processingAction === 'roleChange' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Soft Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Remove user from the system</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to delete <strong className="text-gray-900">{selectedUser.name}</strong>? This will move the user to the deleted list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={processingAction === 'delete'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSoftDelete}
                  disabled={processingAction === 'delete'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'delete' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
                {canHardDeleteUser(selectedUser) && (
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setShowHardDeleteConfirm(true);
                    }}
                    disabled={processingAction === 'delete'}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    Permanent Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirm */}
      {showHardDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Permanent Delete</h3>
                  <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">
                This action is <strong className="text-red-600">irreversible</strong>. All data for <strong className="text-gray-900">{selectedUser.name}</strong> will be permanently wiped.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHardDeleteConfirm(false)}
                  disabled={processingAction === 'hardDelete'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHardDelete}
                  disabled={processingAction === 'hardDelete'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'hardDelete' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recover Modal */}
      {showRecoverModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recover User</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Restore deleted user</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to recover <strong className="text-gray-900">{selectedUser.name}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecoverModal(false)}
                  disabled={processingAction === 'recover'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRecover}
                  disabled={processingAction === 'recover'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'recover' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recovering...</span>
                    </>
                  ) : (
                    "Recover"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Force user to sign out</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">Force logout for <strong className="text-gray-900">{selectedUser.name}</strong>?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={processingAction === 'logout'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={processingAction === 'logout'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'logout' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    "Logout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Subscription Modal */}
      {showPauseModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Pause className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pause Subscription</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Temporarily restrict user access</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to <strong className="text-amber-600">PAUSE</strong> the subscription for <strong className="text-gray-900">{selectedUser.name}</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                <p className="text-xs text-amber-800 font-medium flex items-start gap-2">

                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>This will block their uploads and downloads until the subscription is resumed.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPauseModal(false)}
                  disabled={processingAction === 'pause'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPause}
                  disabled={processingAction === 'pause'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'pause' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Pausing...</span>
                    </>
                  ) : (
                    "Pause Subscription"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Subscription Modal */}
      {showResumeModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slideUp">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">

                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resume Subscription</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Restore user access</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to <strong className="text-green-600">RESUME</strong> the subscription for <strong className="text-gray-900">{selectedUser.name}</strong>?
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
                <p className="text-xs text-green-800 font-medium flex items-start gap-2">

                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>This will restore their ability to upload and download files.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResumeModal(false)}
                  disabled={processingAction === 'resume'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResume}
                  disabled={processingAction === 'resume'}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'resume' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resuming...</span>
                    </>
                  ) : (
                    "Resume Subscription"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Success Alert */}
      {showSuccessToast && (
        <div className="fixed top-24 right-6 z-[100] max-w-sm w-full md:w-[380px]">
           <Alert variant="success" withIcon duration={3000} dismissible onDismiss={() => setShowSuccessToast(false)} className="bg-white/95 backdrop-blur-md shadow-2xl border-green-100">
              <AlertDescription className="font-semibold">{successMessage}</AlertDescription>
           </Alert>
        </div>
      )}

      {/* Error Alert */}
      {showErrorToast && (
        <div className="fixed top-24 right-6 z-[100] max-w-sm w-full md:w-[380px]">
           <Alert variant="destructive" withIcon duration={4000} dismissible onDismiss={() => setShowErrorToast(false)} className="bg-white/95 backdrop-blur-md shadow-2xl border-red-100">
              <AlertDescription className="font-semibold">{errorMessage}</AlertDescription>
           </Alert>
        </div>
      )}

    </div>
  );
}
