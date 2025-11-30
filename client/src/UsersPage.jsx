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
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // File Modals
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Selection
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [previewFileUrl, setPreviewFileUrl] = useState("");

  // Data
  const [userFiles, setUserFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

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
    return currentPriority < targetPriority;
  };

  const getAvailableRolesForUser = (targetUserRole) => {
    const role = currentUser.role;
    if (role === "Owner") {
      return targetUserRole === "Owner" ? ["Owner"] : ["Admin", "Manager", "User"];
    } else if (role === "Admin") {
      if (targetUserRole === "Manager") return ["Admin", "Manager"];
      if (targetUserRole === "User") return ["Manager", "User"];
    } else if (role === "Manager") {
      if (targetUserRole === "User") return ["Manager", "User"];
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
  
  // Role Management
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

  // File Management
  const handleViewClick = async (user) => {
    setSelectedUser(user);
    setShowFilesModal(true);
    setLoadingFiles(true);
    try {
      const response = await fetch(`${BASE_URL}/users/${user._id || user.id}/files`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserFiles(data.files || data);
      } else {
        setUserFiles([]);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setUserFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileClick = (file) => {
    const fileUrl = `${BASE_URL}/users/${selectedUser.id}/files/${file._id || file.id}/view`;
    setPreviewFileUrl(fileUrl);
    setShowFilePreview(true);
  };

  const handleRenameClick = (file) => {
    setSelectedFile(file);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  const confirmRenameFile = async () => {
    if (!selectedFile || !selectedUser || !newFileName.trim()) return;
    try {
      const response = await fetch(
        `${BASE_URL}/users/${selectedUser.id}/files/${selectedFile._id || selectedFile.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFileName.trim() }),
        }
      );
      if (response.ok) {
        setShowRenameModal(false);
        // Refresh files
        handleViewClick(selectedUser);
      }
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  const handleDeleteFileClick = (file) => {
    setSelectedFile(file);
    setShowDeleteFileConfirm(true);
  };

  const confirmDeleteFile = async () => {
    if (!selectedFile || !selectedUser) return;
    try {
      const response = await fetch(
        `${BASE_URL}/users/${selectedUser.id}/files/${selectedFile._id || selectedFile.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        setShowDeleteFileConfirm(false);
        handleViewClick(selectedUser);
      }
    } catch (err) {
      console.error("Delete file error:", err);
    }
  };

  const getFileType = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
    if (["mp3", "wav"].includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
    if (["txt", "md", "js", "json", "html", "css"].includes(ext)) return "text";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
    return "download";
  };

  // --- Stats ---
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => !u.isDeleted).length;
  const deletedUsers = users.filter((u) => u.isDeleted).length;

  // --- Permissions ---
  const canViewFiles = currentUser.role === "Owner" || currentUser.role === "Admin";
  const canDeleteFiles = currentUser.role === "Owner";
  const canRenameFiles = currentUser.role === "Owner";

  // Filter users based on role (Manager sees all, but maybe some logic needed? Prompt says Manager can see all users)
  // Owner sees all.
  // Admin sees all.
  // Normal User cannot access page (handled by redirect in fetchUsers).
  
  // Prompt: "Manager : he can only see all users"
  // Prompt: "Admin : ... admin cant see users file"
  
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section: Back Button & User Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
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
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <FaUsers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <FaCheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Deleted Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{deletedUsers}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
              <FaTrash className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Users Management</h2>
              <p className="text-sm text-gray-500 mt-1">
                Total users: {totalUsers} | Active: {activeUsers} | Deleted: {deletedUsers}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option>All Users</option>
              </select>
              <button 
                onClick={fetchUsers}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-medium">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Storage Used</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <img src={user.picture} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <FaUsers />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatBytes(user.usedStorageInBytes || 0)}
                      </div>
                      <div className="text-xs text-gray-500">of {formatBytes(user.maxStorageLimit || 500 * 1024 * 1024)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
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
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isLoggedIn, user.isDeleted)}`}>
                        {user.isDeleted ? "Deleted" : user.isLoggedIn ? "Logged In" : "Logged Out"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Logout */}
                        {(currentUser.role === "Owner" || currentUser.role === "Admin") && !user.isDeleted && (
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
                        {(currentUser.role === "Owner" || currentUser.role === "Admin") && (
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
                              currentUser.role === "Owner" && (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change User Role</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a new role for <strong>{selectedUser.name}</strong>.
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-6"
            >
              <option value="">Select Role</option>
              {getAvailableRolesForUser(selectedUser.role).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                disabled={!newRole}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Soft Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <FaExclamationTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete User</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? 
              This will move the user to the deleted list.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSoftDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              {currentUser.role === "Owner" && (
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setShowHardDeleteConfirm(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                >
                  Permanent Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirm */}
      {showHardDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Permanent Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              This action is <strong>irreversible</strong>. All data for <strong>{selectedUser.name}</strong> will be wiped.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowHardDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleHardDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Confirm Permanent Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-6">
              Force logout for <strong>{selectedUser.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Logout User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Modal */}
      {showFilesModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}'s Files</h3>
              <button onClick={() => setShowFilesModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingFiles ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : userFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No files found.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 border-b border-gray-200">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userFiles.map(file => (
                      <tr key={file._id || file.id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <button 
                            onClick={() => handleFileClick(file)}
                            className="text-blue-600 hover:underline font-medium text-sm flex items-center gap-2"
                          >
                            <FaFile className="text-gray-400" />
                            {file.name}
                          </button>
                        </td>
                        <td className="py-3 text-sm text-gray-600">{formatBytes(file.size)}</td>
                        <td className="py-3 text-sm text-gray-600">{file.type || "File"}</td>
                        <td className="py-3 flex gap-2">
                          {canRenameFiles && (
                            <button 
                              onClick={() => handleRenameClick(file)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title="Rename"
                            >
                              <FaPen className="w-3 h-3" />
                            </button>
                          )}
                          {canDeleteFiles && (
                            <button 
                              onClick={() => handleDeleteFileClick(file)}
                              className="p-1 text-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {!canDeleteFiles && !canRenameFiles && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                <FaExclamationTriangle className="inline w-4 h-4 mr-2 text-yellow-500" />
                Read-only access
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {showRenameModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rename File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full border-gray-300 rounded-lg mb-6"
              placeholder="New filename"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRenameModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={confirmRenameFile} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Confirm */}
      {showDeleteFileConfirm && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete File</h3>
            <p className="mb-6 text-sm text-gray-600">Delete <strong>{selectedFile.name}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteFileConfirm(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={confirmDeleteFile} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowFilePreview(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">{selectedFile.name}</h3>
              <button onClick={() => setShowFilePreview(false)}>&times;</button>
            </div>
            <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-auto">
              {getFileType(selectedFile.name) === "image" ? (
                <img src={previewFileUrl} alt="" className="max-w-full max-h-full object-contain" />
              ) : getFileType(selectedFile.name) === "video" ? (
                <video src={previewFileUrl} controls className="max-w-full max-h-full" />
              ) : (
                <div className="text-center">
                  <FaFile className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>Preview not available</p>
                  <a href={previewFileUrl} download className="text-blue-600 hover:underline mt-2 inline-block">Download</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
