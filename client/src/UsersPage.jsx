import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";
import {
  FaArrowLeft,
  FaUsers,
  FaCheckCircle,
  FaTrash,
  FaPen,
  FaEye,
  FaSignOutAlt,
  FaUndo,
  FaExclamationTriangle,
  FaFile,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePdf,
  FaFileAlt,
  FaDownload,
  FaBolt,

} from "react-icons/fa";

export default function UsersPage() {
  const navigate = useNavigate();

  // --- State ---
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState({
    name: "Guest User",
    email: "",
    picture: "",
    role: "User",
  });

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // File Modals
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Selection
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  // Data

  // --- Effects ---
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  // --- Fetching ---
  async function fetchCurrentUser() {
    try {
      const response = await fetch(`${BASE_URL}/user`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser({
          name: data.name,
          email: data.email,
          picture: data.picture,
          role: data.role,
        });
      } else if (response.status === 401) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  }

  async function fetchUsers() {
    try {
      // Fetch basic user data
      const usersResponse = await fetch(`${BASE_URL}/users`, { credentials: "include" });
      
      // Fetch permission data
      let permissionData = { users: [] };
      try {
        const permResponse = await fetch(`${BASE_URL}/users/permission`, { credentials: "include" });
        if (permResponse.ok) {
          permissionData = await permResponse.json();
        }
      } catch (err) {
        console.warn("Could not fetch permission data:", err);
      }

      // Fetch current user data to ensure self-role is correct
      let myData = null;
      try {
        const meResponse = await fetch(`${BASE_URL}/user`, { credentials: "include" });
        if (meResponse.ok) {
          myData = await meResponse.json();
        }
      } catch (err) {
        console.warn("Could not fetch my data:", err);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        
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
          // Ensure we don't match undefined === undefined
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
      } else if (usersResponse.status === 403) {
        navigate("/");
      } else if (usersResponse.status === 401) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
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
    }
  };

  // User Actions
  const handleLogoutClick = (user) => {
    setSelectedUser(user);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    if (!selectedUser) return;
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
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSoftDelete = async () => {
    if (!selectedUser) return;
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
    }
  };

  const handleHardDelete = async () => {
    if (!selectedUser) return;
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
    }
  };

  const handleRecoverClick = (user) => {
    setSelectedUser(user);
    setShowRecoverModal(true);
  };

  const confirmRecover = async () => {
    if (!selectedUser) return;
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
    }
  };

  // --- Permissions ---
  const canViewFiles = currentUser.role === "Owner" || currentUser.role === "Admin";
  const canDeleteFiles = currentUser.role === "Owner"; // Only Owner can delete files (from prompt: Admin can't open or rename, doesn't say delete file, but usually implied no write access if no rename)
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
    if (currentUser.role === "Admin") return targetUser.role !== "Owner"; // Admin can logout anyone except Owner? Usually lower rank.
    // Prompt says: Admin can logout the user. Manager can logout that user.
    // Let's assume they can logout anyone visible in their list (which is filtered above).
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
    <div className="min-h-screen bg-gray-50">
      <DirectoryHeader
        directoryName="Users"
        path={[]}
        userName={currentUser.name}
        userEmail={currentUser.email}
        userPicture={currentUser.picture}
        userRole={currentUser.role}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Section: Back Button & User Info */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <FaArrowLeft className="w-3 h-3" />
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
              <FaUsers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <FaCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Active Users</p>
              <p className="text-xl font-bold text-gray-900">{activeUsers}</p>
            </div>
          </div>

          {/* Online Users */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 border border-gray-100">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <FaBolt className="w-5 h-5" />
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
              <FaTrash className="w-5 h-5" />
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
                onClick={fetchUsers}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
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
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            <FaUsers />
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
                            onClick={() => handleRoleChangeClick(user)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <FaPen className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isLoggedIn, user.isDeleted)}`}>
                        {user.isDeleted ? "Deleted" : user.isLoggedIn ? "Logged In" : "Logged Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Logout */}
                        {canLogoutUser(user) && !user.isDeleted && (
                          <button
                            onClick={() => handleLogoutClick(user)}
                            disabled={!user.isLoggedIn}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isLoggedIn 
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
                                onClick={() => handleDeleteClick(user)}
                                disabled={user.email === currentUser.email}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                              >
                                Delete
                              </button>
                            ) : (
                              canHardDeleteUser(user) && (
                                <button
                                  onClick={() => handleRecoverClick(user)}
                                  className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 transition-colors"
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
                            onClick={() => handleViewClick(user)}
                            className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            title="View Files"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Change User Role</h3>
              <p className="text-sm text-gray-500 mt-1">Update role for {selectedUser.name}</p>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {/* Current User Info */}
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

              {/* Role Selection */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleChange}
                  disabled={!newRole}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Save Changes
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
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Remove user from the system</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to delete <strong className="text-gray-900">{selectedUser.name}</strong>? 
                This will move the user to the deleted list.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSoftDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                {canHardDeleteUser(selectedUser) && (
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setShowHardDeleteConfirm(true);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
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
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600">Permanent Delete</h3>
                  <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">
                This action is <strong className="text-red-600">irreversible</strong>. All data for <strong className="text-gray-900">{selectedUser.name}</strong> will be permanently wiped.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHardDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHardDelete}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
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
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaSignOutAlt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Force user to sign out</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-5">
                Force logout for <strong className="text-gray-900">{selectedUser.name}</strong>?
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Logout User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
