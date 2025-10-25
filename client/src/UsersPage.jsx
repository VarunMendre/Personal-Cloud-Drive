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
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const logoutUser = async (user) => {
    const { id, email } = user;
    const logOutConfirmed = confirm(`Are you sure to Logout ${email} `);
    if (!logOutConfirmed) return;
    try {
      const response = await fetch(`${BASE_URL}/users/${id}/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        console.log("Logged out successfully");
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

  const closeModal = () => {
    setShowDeleteModal(false);
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
            {userRole === "Admin" && <th></th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.isLoggedIn ? "Logged In" : "Logged Out"}</td>
              <td>
                <button
                  className="logout-button"
                  onClick={() => logoutUser(user)}
                  disabled={!user.isLoggedIn}
                >
                  Logout
                </button>
              </td>

              {userRole === "Admin" && (
                <td>
                  <button
                    className="logout-button delete-button"
                    onClick={() => handleDeleteClick(user)}
                    disabled={userEmail === user.email}
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

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
                  onClick={() => {
                    const confirmed = confirm(
                      `Are you sure you want to permanently delete this user? This action CANNOT be undone.`
                    );
                    if (confirmed) {
                      handleHardDelete();
                    }
                  }}
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
    </div>
  );
}
