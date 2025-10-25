import { useEffect, useState } from "react";
import { BASE_URL } from "./components/DirectoryHeader";
import { useNavigate } from "react-router-dom";
import "./UsersPage.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const handleLogoutClick = (user) => {
    setSelectedUser(user);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    if (!selectedUser) return;
    const { id } = selectedUser;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("Logged out successfully");
        setShowLogoutModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        console.error("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleRecoverClick = (user) => {
    setSelectedUser(user);
    setShowRecoverModal(true);
  };

  const confirmRecover = async () => {
    if (!selectedUser) return;
    const { id } = selectedUser;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/recover`, {
        method: "PUT",
        credentials: "include",
      });
      if (response.ok) {
        console.log("User recovered successfully");
        setShowRecoverModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        console.error("Recover failed");
      }
    } catch (err) {
      console.error("Recover error:", err);
    }
  };

  const closeModal = () => {
    setShowDeleteModal(false);
    setShowRecoverModal(false);
    setShowLogoutModal(false);
    setShowHardDeleteConfirm(false);
    setSelectedUser(null);
  };

  const handleSoftDelete = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${BASE_URL}/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        console.log("User soft deleted successfully");
        closeModal();
        fetchUsers();
      } else {
        console.error("Soft delete failed");
      }
    } catch (err) {
      console.error("Soft delete error:", err);
    }
  };

  const handleHardDeleteClick = () => {
    setShowDeleteModal(false);
    setShowHardDeleteConfirm(true);
  };

  const handleHardDelete = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(
        `${BASE_URL}/users/${selectedUser.id}/hard`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        console.log("User permanently deleted");
        closeModal();
        fetchUsers();
      } else {
        console.error("Hard delete failed");
      }
    } catch (err) {
      console.error("Hard delete error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUser();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch(`${BASE_URL}/users`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log(data);
      } else if (response.status === 403) {
        navigate("/");
      } else if (response.status === 401) {
        navigate("/login");
      } else {
        console.error("Error fetching users data", response.status);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  }

  async function fetchUser() {
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

  const filteredUsers = users.filter((user) => {
    if (userRole === "Owner") {
      return true;
    }
    return !user.isDeleted;
  });

  return (
    <div className="users-container">
      <h1 className="title">All Users</h1>
      <p>
        {userName}: {userRole}
      </p>
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th></th>
            {(userRole === "Admin" || userRole === "Owner") && <th></th>}
            {userRole === "Owner" && <th></th>}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} className={user.isDeleted ? "deleted-user" : ""}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                {user.isDeleted
                  ? "Deleted"
                  : user.isLoggedIn
                  ? "Logged In"
                  : "Logged Out"}
              </td>
              <td>
                <button
                  className="logout-button"
                  onClick={() => handleLogoutClick(user)}
                  disabled={!user.isLoggedIn || user.isDeleted}
                >
                  Logout
                </button>
              </td>

              {(userRole === "Admin" || userRole === "Owner") && (
                <td>
                  <button
                    className="logout-button delete-button"
                    onClick={() => handleDeleteClick(user)}
                    disabled={userEmail === user.email || user.isDeleted}
                  >
                    Delete
                  </button>
                </td>
              )}

              {userRole === "Owner" && (
                <td>
                  <button
                    className="logout-button recover-button"
                    onClick={() => handleRecoverClick(user)}
                    disabled={
                      userEmail === user.email ||
                      user.isLoggedIn ||
                      !user.isDeleted
                    }
                  >
                    Recover
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {showLogoutModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Logout</h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info">
                Are you sure you want to logout{" "}
                <strong>{selectedUser.email}</strong>?
              </p>
              <div className="confirm-actions">
                <button className="cancel-button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="confirm-button" onClick={confirmLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecoverModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Recovery</h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info">
                Are you sure you want to recover{" "}
                <strong>{selectedUser.email}</strong>?
              </p>
              <div className="confirm-actions">
                <button className="cancel-button" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="confirm-button recover-confirm"
                  onClick={confirmRecover}
                >
                  Recover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User</h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info">
                Select delete type for: <strong>{selectedUser.email}</strong>
              </p>

              <div className="delete-options">
                <button
                  className="delete-option soft-delete"
                  onClick={handleSoftDelete}
                >
                  <div className="option-title">Soft Delete</div>
                  <div className="option-description">
                    Mark user as deleted but allow recovery
                  </div>
                </button>

                <button
                  className="delete-option hard-delete"
                  onClick={handleHardDeleteClick}
                >
                  <div className="option-title">Hard Delete</div>
                  <div className="option-description">
                    Permanently remove user - cannot be undone
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHardDeleteConfirm && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content confirm-modal danger-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Hard Delete</h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info danger-text">
                Are you sure you want to <strong>permanently delete</strong>{" "}
                <strong>{selectedUser.email}</strong>?
              </p>
              <p className="warning-text">This action CANNOT be undone!</p>
              <div className="confirm-actions">
                <button className="cancel-button" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="confirm-button danger-button"
                  onClick={handleHardDelete}
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
