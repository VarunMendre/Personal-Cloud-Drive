"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserPermission.css";

const BASE_URL = "http://localhost:4000";

export default function UserPermission() {
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
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
      <div className="permissions-container">
        <p className="loading-message">Loading permissions...</p>
      </div>
    );
  }

  return (
    <div className="permissions-container">
      <h1 className="title">User Permissions Management</h1>
      <p className="current-user-info">
        {userName}: <strong>{userRole}</strong>
      </p>
      <p className="info-text">
        You can manage roles for: <strong>{editableRoles.join(", ")}</strong>
      </p>

      {error && <div className="error-message">{error}</div>}

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Current Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <span
                  className="role-badge"
                  style={{ backgroundColor: getRoleColor(user.role) }}
                >
                  {user.role}
                </span>
              </td>
              <td>
                <button
                  className="change-role-button"
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
        <p className="no-users-message">
          No users available to manage at this time.
        </p>
      )}

      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change User Role</h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info">
                Changing role for: <strong>{selectedUser.email}</strong>
              </p>
              <p className="current-role-info">
                Current role:{" "}
                <span
                  className="role-badge"
                  style={{ backgroundColor: getRoleColor(selectedUser.role) }}
                >
                  {selectedUser.role}
                </span>
              </p>

              <div className="role-selection">
                <label htmlFor="role-select">Select new role:</label>
                <select
                  id="role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="role-select"
                >
                  <option value="">-- Select a role --</option>
                  {getAvailableRolesForUser(selectedUser.role).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="confirm-actions">
                <button className="cancel-button" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="confirm-button"
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
  );
}
