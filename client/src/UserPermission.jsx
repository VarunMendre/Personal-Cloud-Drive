"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";

export default function UserPermission() {
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userPicture, setUserPicture] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [editableRoles, setEditableRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsersWithPermissions();
  }, []);

  async function fetchCurrentUser() {
    try {
      const response = await fetch(`${BASE_URL}/user`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserName(data.name);
        setUserEmail(data.email);
        setUserPicture(data.picture);
        setUserRole(data.role);
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        console.error("Error fetching user info:", response.status);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  }

  async function fetchUsersWithPermissions() {
    try {
      const response = await fetch(`${BASE_URL}/users/permission`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setEditableRoles(data.editableRoles);
        setError("");
        console.log("Permission data:", data);
      } else if (response.status === 403) {
        setError("You don't have permission to access this page");
        navigate("/");
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        console.error("Error fetching permissions data", response.status);
        setError("Failed to load user permissions");
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError("An error occurred while loading permissions");
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChangeClick = (user) => {
    setSelectedUser(user);
    setNewRole("");
    setShowRoleModal(true);
  };

  const closeModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    setNewRole("");
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const response = await fetch(
        `${BASE_URL}/users/${selectedUser._id}/role`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        console.log("Role changed successfully");
        closeModal();
        fetchUsersWithPermissions();
      } else {
        const errorData = await response.json();
        console.error("Role change failed:", errorData.error);
        alert(errorData.error || "Failed to change role");
      }
    } catch (err) {
      console.error("Role change error:", err);
      alert("An error occurred while changing the role");
    }
  };

  const getAvailableRolesForUser = (targetUserRole) => {
    if (userRole === "Owner") {
      if (targetUserRole === "Owner") {
        return ["Owner"];
      }
      return ["Admin", "Manager", "User"];
    } else if (userRole === "Admin") {
      if (targetUserRole === "Manager") {
        return ["Admin", "Manager"];
      } else if (targetUserRole === "User") {
        return ["Manager", "User"];
      }
    } else if (userRole === "Manager") {
      if (targetUserRole === "User") {
        return ["Manager", "User"];
      }
    }
    return [];
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Owner":
        return "#dc3545";
      case "Admin":
        return "#fd7e14";
      case "Manager":
        return "#007bff";
      case "User":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  };

  const getRolePriority = (role) => {
    const priorities = {
      Owner: 1,
      Admin: 2,
      Manager: 3,
      User: 4,
    };
    return priorities[role] || 5;
  };

  const canChangeRole = (targetUser) => {
    if (userEmail === targetUser.email) {
      return false;
    }

    if (userRole === "Owner") {
      return true;
    }

    const currentUserPriority = getRolePriority(userRole);
    const targetUserPriority = getRolePriority(targetUser.role);

    return currentUserPriority < targetUserPriority;
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto my-10">
        <p className="text-center py-10 text-[#666] text-base">Loading permissions...</p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="max-w-[900px] mx-auto my-10">
      <h1 className="text-[2em] font-bold mb-5">User Permissions Management</h1>
      <p className="mb-[5px] text-sm text-[#333]">
=======
    <>
      <DirectoryHeader
        directoryName="Permissions"
        path={[]}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
      />
      <div className="permissions-container">
      <h1 className="title">User Permissions Management</h1>
      <p className="current-user-info">
>>>>>>> backup/branch
        {userName}: <strong>{userRole}</strong>
      </p>
      <p className="mb-[30px] text-[13px] text-[#007bff]">
        You can manage roles for: <strong>{editableRoles.join(", ")}</strong>
      </p>

      {error && <div className="bg-[#f8d7da] border border-[#f5c6cb] text-[#721c24] px-4 py-3 rounded mb-5 text-sm">{error}</div>}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Name</th>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Email</th>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Current Role</th>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="border border-[#ddd] p-3 text-left">{user.name}</td>
              <td className="border border-[#ddd] p-3 text-left">{user.email}</td>
              <td className="border border-[#ddd] p-3 text-left">
                <span
                  className="inline-block px-3 py-1 rounded-xl text-white text-xs font-semibold uppercase"
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  {user.role}
                </span>
              </td>
              <td className="border border-[#ddd] p-3 text-left">
                <button
                  className="px-3 py-[6px] text-sm border-none rounded bg-[#28a745] text-white cursor-pointer transition-colors duration-200 hover:not(:disabled):bg-[#218838] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                  onClick={() => handleRoleChangeClick(user)}
                  disabled={!canChangeRole(user)}
                >
                  Change Role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="text-center py-10 text-[#666] italic">
          No users available to manage at this time.
        </p>
      )}

      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-lg w-[90%] max-w-[500px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] animate-[modalFadeIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[#ddd]">
              <h2 className="m-0 text-2xl">Change User Role</h2>
              <button className="bg-transparent border-none text-[28px] cursor-pointer text-[#666] p-0 w-[30px] h-[30px] flex items-center justify-center transition-colors duration-200 hover:text-black" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="p-5">
              <p className="mb-[15px] text-sm text-[#333]">
                Changing role for: <strong>{selectedUser.email}</strong>
              </p>
              <p className="mb-5 text-sm text-[#666]">
                Current role:{" "}
                <span
                  className="inline-block px-3 py-1 rounded-xl text-white text-xs font-semibold uppercase"
                  style={{ backgroundColor: getRoleColor(selectedUser.role) }}
                >
                  {selectedUser.role}
                </span>
              </p>

              <div className="mb-[25px]">
                <label htmlFor="role-select" className="block mb-2 font-semibold text-[#333] text-sm">Select new role:</label>
                <select
                  id="role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-[10px] border border-[#ddd] rounded bg-white cursor-pointer transition-colors duration-200 focus:outline-none focus:border-[#007bff] focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                >
                  <option value="">-- Select a role --</option>
                  {getAvailableRolesForUser(selectedUser.role).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-5">
                <button className="px-5 py-[10px] border border-[#ddd] rounded bg-white text-[#333] text-sm cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-[#999]" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="px-5 py-[10px] border-none rounded bg-[#007bff] text-white text-sm cursor-pointer transition-all duration-200 hover:bg-[#0056b3] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                  onClick={confirmRoleChange}
                  disabled={!newRole || newRole === selectedUser.role}
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
