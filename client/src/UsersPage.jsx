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
  const [searchQuery, setSearchQuery] = useState("");
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
      case "Owner": return "bg-rose-50 text-rose-700 border border-rose-100";
      case "Admin": return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Manager": return "bg-indigo-50 text-indigo-700 border border-indigo-100";
      case "User": return "bg-slate-50 text-slate-700 border border-slate-100";
      default: return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  const getStatusColor = (isLoggedIn, isDeleted) => {
    if (isDeleted) return "bg-red-50 text-red-700 border border-red-100";
    if (isLoggedIn) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    return "bg-slate-50 text-slate-500 border border-slate-100";
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
    // Role filter
    let roleMatch = false;
    if (currentUser.role === "Owner") roleMatch = true;
    else if (currentUser.role === "Admin") roleMatch = (u.role !== "Owner");
    else if (currentUser.role === "Manager") roleMatch = (u.role !== "Owner" && u.role !== "Admin");

    // Search filter
    const searchMatch = !searchQuery || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    return roleMatch && searchMatch;
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
        {/* Top Section: Navigation & User Identity */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 group">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl transition-all text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 group-hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>

          <div className="flex items-center gap-4 bg-white p-2 pr-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="relative">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border-2 border-white shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-slate-800 leading-tight">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 font-medium">{currentUser.email}</div>
            </div>
            <div className="h-6 w-px bg-slate-100 hidden sm:block mx-1"></div>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg ${getRoleColor(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 border border-slate-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-slate-800">{totalUsers}</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 border border-slate-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Users</p>
              <p className="text-2xl font-bold text-slate-800">{activeUsers}</p>
            </div>
          </div>

          {/* Online Users */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 border border-slate-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Online Users</p>
              <p className="text-2xl font-bold text-slate-800">
                {users.filter(u => u.isLoggedIn && !u.isDeleted).length}
              </p>
            </div>
          </div>

          {/* Deleted Users */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 flex items-center gap-4 border border-slate-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deleted Users</p>
              <p className="text-2xl font-bold text-slate-800">{deletedUsers}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
            <div>
              <h2 className="text-lg font-bold text-slate-800">User Management</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage accounts, roles, and storage quotas
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64"
                />
              </div>
              <button 
                onClick={() => !processingAction && fetchUsers()}
                disabled={!!processingAction}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${processingAction ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Storage Usage</th>
                  <th className="px-6 py-4">Role & Status</th>
                  {currentUser.role === "Owner" && <th className="px-6 py-4">Subscription</th>}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={currentUser.role === "Owner" ? "6" : "5"} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-slate-50 border-t-indigo-500 animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Users className="w-8 h-8 text-indigo-500 shadow-sm" />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-800">Synchronizing Users</p>
                          <p className="text-sm text-slate-400 font-medium">Please wait while we fetch the latest directory data...</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === "Owner" ? "6" : "5"} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-6">
                         <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100 transform rotate-3">
                          <Search className="w-10 h-10 text-slate-300 transform -rotate-3" />
                        </div>
                        <div className="max-w-xs mx-auto">
                          <p className="text-lg font-bold text-slate-800">No users matched your search</p>
                          <p className="text-sm text-slate-400 mt-2">We couldn't find any users matching "<span className="text-slate-600 font-bold">{searchQuery}</span>". Try a different search term.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const usagePercent = Math.min(100, Math.round(((user.usedStorageInBytes || 0) / (user.maxStorageLimit || 500 * 1024 * 1024)) * 100));
                    
                    return (
                      <tr key={user._id || user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {user.picture ? (
                                <img src={user.picture} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm outline outline-1 outline-slate-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold border-2 border-white shadow-sm outline outline-1 outline-slate-100">
                                  {user.name.charAt(0)}
                                </div>
                              )}
                              {user.isLoggedIn && !user.isDeleted && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-48">
                            <div className="flex justify-between items-end mb-1.5">
                              <span className="text-[11px] font-bold text-slate-700">{formatBytes(user.usedStorageInBytes || 0)}</span>
                              <span className="text-[10px] font-medium text-slate-400">{usagePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">of {formatBytes(user.maxStorageLimit || 500 * 1024 * 1024)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                            {canChangeRole(user) && (
                              <button 
                                onClick={() => !processingAction && handleRoleChangeClick(user)}
                                disabled={!!processingAction}
                                className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                                title="Change Role"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(user.isLoggedIn, user.isDeleted)}`}>
                            {user.isDeleted ? "Deleted" : user.isLoggedIn ? "Online" : "Offline"}
                          </span>
                        </td>
                        {currentUser.role === "Owner" && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.razorpaySubscriptionId ? (
                                <>
                                  <div className="flex flex-col gap-1.5">
                                    {user.subscriptionStatus === "paused" ? (
                                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit">
                                        <AlertTriangle className="w-3 h-3 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase">Paused</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                                        <CheckCircle className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">Active</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex gap-1">
                                      {user.subscriptionStatus === "paused" ? (
                                        <button
                                          onClick={() => !processingAction && handleResumeSubscription(user)}
                                          disabled={!!processingAction}
                                          className="text-[9px] font-bold text-emerald-600 hover:underline uppercase"
                                        >
                                          Resume
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => !processingAction && handlePauseSubscription(user)}
                                          disabled={!!processingAction}
                                          className="text-[9px] font-bold text-amber-600 hover:underline uppercase"
                                        >
                                          Pause
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Basic</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Files */}
                            {canViewFiles && !user.isDeleted && (
                              <button
                                onClick={() => !processingAction && handleViewClick(user)}
                                disabled={!!processingAction}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                                title="View User Files"
                              >
                                <Eye className="w-4.5 h-4.5" />
                              </button>
                            )}

                            {/* Logout */}
                            {canLogoutUser(user) && !user.isDeleted && user.isLoggedIn && (
                              <button
                                onClick={() => !processingAction && handleLogoutClick(user)}
                                disabled={!!processingAction}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-50"
                                title="Force Logout"
                              >
                                <LogOut className="w-4.5 h-4.5" />
                              </button>
                            )}
    
                            {/* Delete/Recover */}
                            {canDeleteUser(user) && (
                              <>
                                {!user.isDeleted ? (
                                  <button
                                    onClick={() => !processingAction && handleDeleteClick(user)}
                                    disabled={user.email === currentUser.email || !!processingAction}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                ) : (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => !processingAction && handleRecoverClick(user)}
                                      disabled={!!processingAction}
                                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100"
                                    >
                                      Recover
                                    </button>
                                    {canHardDeleteUser(user) && (
                                       <button
                                       onClick={() => {
                                         setSelectedUser(user);
                                         setShowHardDeleteConfirm(true);
                                       }}
                                       disabled={!!processingAction}
                                       className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase rounded-lg hover:bg-rose-100 transition-all border border-rose-100"
                                     >
                                       Purge
                                     </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Update User Role</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Set permissions hierarchy for the team member</p>
            </div>
            <div className="px-8 py-8">
              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {selectedUser.picture ? (
                  <img src={selectedUser.picture} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm border border-white" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-white shadow-sm">
                    {selectedUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate">{selectedUser.name}</div>
                  <div className="text-xs text-slate-400 font-medium truncate">{selectedUser.email}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getRoleColor(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">New Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 font-semibold appearance-none"
                >
                  <option value="">Select a new role...</option>
                  {getAvailableRolesForUser(selectedUser.role).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  disabled={processingAction === 'roleChange'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={!newRole || processingAction === 'roleChange'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingAction === 'roleChange' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Update Role"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Soft Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-rose-50 bg-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Deactivate User</h3>
                  <p className="text-sm text-rose-500 font-semibold uppercase tracking-wider">Restricted Action</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8">
              <p className="text-slate-600 font-medium leading-relaxed mb-8">
                You are about to deactivate <strong className="text-slate-900">{selectedUser.name}</strong>. The user's files will remain preserved, but access will be suspended.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={processingAction === 'delete'}
                    className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Keep User
                  </button>
                  <button
                    onClick={handleSoftDelete}
                    disabled={processingAction === 'delete'}
                    className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-rose-600 rounded-2xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingAction === 'delete' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deactivate"}
                  </button>
                </div>
                {canHardDeleteUser(selectedUser) && (
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setShowHardDeleteConfirm(true);
                    }}
                    disabled={processingAction === 'delete'}
                    className="w-full px-6 py-3.5 text-xs font-bold text-rose-400 bg-rose-50/50 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-all disabled:opacity-50 uppercase tracking-widest border border-rose-100/50"
                  >
                    Permanent Deletion
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirm */}
      {showHardDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-rose-100 bg-rose-600">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Security Check</h3>
                  <p className="text-xs text-rose-100 font-bold uppercase tracking-widest opacity-80">Irreversible Action</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
                <Trash2 className="w-10 h-10 text-rose-500" />
              </div>
              <p className="text-slate-600 font-medium leading-relaxed mb-8">
                This will <strong className="text-rose-600 uppercase tracking-tighter">permanently erase</strong> all data for <strong className="text-slate-900">{selectedUser.name}</strong>. This content cannot be recovered under any circumstances.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHardDeleteConfirm(false)}
                  disabled={processingAction === 'hardDelete'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Abort
                </button>
                <button
                  onClick={handleHardDelete}
                  disabled={processingAction === 'hardDelete'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-rose-600 rounded-2xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'hardDelete' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Wipe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recover Modal */}
      {showRecoverModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-emerald-50 bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <RotateCcw className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Restore User</h3>
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Account Recovery</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm font-bold text-emerald-600 text-2xl">
                {selectedUser.name.charAt(0)}
              </div>
              <p className="text-slate-600 font-medium leading-relaxed mb-8 text-center">
                Are you sure you want to restore <strong className="text-slate-900">{selectedUser.name}</strong>'s account? All their files and permissions will be reactivated.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecoverModal(false)}
                  disabled={processingAction === 'recover'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRecover}
                  disabled={processingAction === 'recover'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'recover' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Recover User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-indigo-50 bg-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <LogOut className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Terminate Session</h3>
                  <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">Security Action</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8">
              <p className="text-slate-600 font-medium leading-relaxed mb-8">
                Force logout for <strong className="text-slate-900">{selectedUser.name}</strong>? They will need to re-authenticate to access the platform.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={processingAction === 'logout'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={processingAction === 'logout'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'logout' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Out User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause Subscription Modal */}
      {showPauseModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-amber-50 bg-amber-50/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <Pause className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Pause Benefits</h3>
                  <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">Quota Restriction</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8">
              <div className="bg-amber-50/50 border-2 border-amber-100/50 rounded-2xl p-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    Pausing the subscription for <span className="text-slate-900">{selectedUser.name}</span> will instantly disable all premium features and block further data uploads.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPauseModal(false)}
                  disabled={processingAction === 'pause'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPause}
                  disabled={processingAction === 'pause'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-amber-600 rounded-2xl hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'pause' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pause Access"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Subscription Modal */}
      {showResumeModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-emerald-50 bg-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                  <Play className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Resume Access</h3>
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Restore Full Quota</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8">
              <div className="bg-emerald-50/50 border-2 border-emerald-100/50 rounded-2xl p-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                    Restoring access for <span className="text-slate-900">{selectedUser.name}</span> will immediately reactivate all premium quotas and features.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowResumeModal(false)}
                  disabled={processingAction === 'resume'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResume}
                  disabled={processingAction === 'resume'}
                  className="flex-1 px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingAction === 'resume' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resume Access"}
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
