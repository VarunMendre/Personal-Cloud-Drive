import { useEffect, useState } from "react";
import { BASE_URL } from "./components/DirectoryHeader";
import DirectoryHeader from "./components/DirectoryHeader";
import { useNavigate } from "react-router-dom";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState("Guest User");
  const [userEmail, setUserEmail] = useState("");
  const [userPicture, setUserPicture] = useState("");
  const [userRole, setUserRole] = useState("User");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const navigate = useNavigate();

  // Handle View button click - fetch and display user files
  const handleViewClick = async (user) => {
    setSelectedUser(user);
    setShowFilesModal(true);
    setLoadingFiles(true);

    const userId = user._id || user.id; // ✅ Fix: ensure correct ID is used

    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/files`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserFiles(data.files || data);
      } else if (response.status === 403) {
        console.warn(
          "Access forbidden: you don’t have permission to view these files"
        );
        alert("You don't have permission to view these files.");
        setShowFilesModal(false);
      } else {
        console.error("Failed to fetch user files");
        setUserFiles([]);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
      setUserFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };


  // Handle file click to open/view
  const handleFileClick = (file) => {
    const fileUrl = `${BASE_URL}/users/${selectedUser.id}/files/${
      file._id || file.id
    }/view`;
    setPreviewFileUrl(fileUrl);
    setShowFilePreview(true);
  };

  const closeFilePreview = () => {
    setShowFilePreview(false);
    setPreviewFileUrl("");
  };

  const getFileType = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(
        extension
      )
    ) {
      return "image";
    }
    if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(extension)) {
      return "video";
    }
    if (["mp3", "wav", "ogg", "aac", "m4a"].includes(extension)) {
      return "audio";
    }
    if (["pdf"].includes(extension)) {
      return "pdf";
    }
    if (
      [
        "txt",
        "log",
        "md",
        "json",
        "xml",
        "csv",
        "js",
        "jsx",
        "ts",
        "tsx",
        "html",
        "css",
        "py",
        "java",
        "c",
        "cpp",
        "sh",
      ].includes(extension)
    ) {
      return "text";
    }
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)) {
      return "office";
    }
    return "download";
  };

  // Handle rename button click
  const handleRenameClick = (file) => {
    setSelectedFile(file);
    setNewFileName(file.name);
    setShowRenameModal(true);
  };

  // Confirm file rename
  const confirmRenameFile = async () => {
    if (!selectedFile || !selectedUser || !newFileName.trim()) {
      alert("Please enter a valid file name");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/users/${selectedUser.id}/files/${
          selectedFile._id || selectedFile.id
        }`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newFileName.trim() }),
        }
      );

      if (response.ok) {
        console.log("File renamed successfully");
        setShowRenameModal(false);
        setSelectedFile(null);
        setNewFileName("");

        // Refresh the files list
        setLoadingFiles(true);
        try {
          const refreshResponse = await fetch(
            `${BASE_URL}/users/${selectedUser.id}/files`,
            {
              credentials: "include",
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setUserFiles(data.files || data);
          }
        } catch (refreshErr) {
          console.error("Error refreshing files:", refreshErr);
        } finally {
          setLoadingFiles(false);
        }
      } else {
        const errorData = await response.json();
        console.error("Rename file failed:", errorData);
        alert(`Failed to rename file: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Rename file error:", err);
      alert("Network error. Please try again.");
    }
  };

  // Handle delete file button click
  const handleDeleteFileClick = (file) => {
    setSelectedFile(file);
    setShowDeleteFileConfirm(true);
  };

  // Confirm file deletion
  const confirmDeleteFile = async () => {
    if (!selectedFile || !selectedUser) return;

    try {
      const response = await fetch(
        `${BASE_URL}/users/${selectedUser.id}/files/${
          selectedFile._id || selectedFile.id
        }`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        console.log("File deleted successfully");
        setShowDeleteFileConfirm(false);
        setSelectedFile(null);

        // Refresh the files list
        setLoadingFiles(true);
        try {
          const refreshResponse = await fetch(
            `${BASE_URL}/users/${selectedUser.id}/files`,
            {
              credentials: "include",
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setUserFiles(data.files || data);
          }
        } catch (refreshErr) {
          console.error("Error refreshing files:", refreshErr);
        } finally {
          setLoadingFiles(false);
        }
      } else {
        const errorData = await response.json();
        console.error("Delete file failed:", errorData);
        alert(`Failed to delete file: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete file error:", err);
      alert("Network error. Please try again.");
    }
  };

  // Close files modal
  const closeFilesModal = () => {
    setShowFilesModal(false);
    setShowDeleteFileConfirm(false);
    setShowFilePreview(false);
    setShowRenameModal(false);
    setPreviewFileUrl("");
    setSelectedUser(null);
    setUserFiles([]);
    setSelectedFile(null);
    setNewFileName("");
  };

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

        // ✅ Fix: ensure each user has correct boolean `isLoggedIn`
        const normalized = data.map((u) => ({
          ...u,
          isLoggedIn:
            u.isLoggedIn === true ||
            u.isLoggedIn === "true" ||
            u.status === "online" ||
            u.active === true,
        }));

        setUsers(normalized);
        console.log("Fetched users:", normalized);
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

  const filteredUsers = users.filter((user) => {
    if (userRole === "Owner") {
      return true;
    }
    return !user.isDeleted;
  });

  // RBAC checks
  const canViewFiles = userRole === "Owner" || userRole === "Admin";
  const canDeleteFiles = userRole === "Owner";
  const canRenameFiles = userRole === "Owner";

  return (
<<<<<<< HEAD
    <div className="max-w-[900px] mx-auto my-10">
      <h1 className="text-[2em] font-bold mb-5">All Users</h1>
=======
    <>
      <DirectoryHeader
        directoryName="Users"
        path={[]}
        userName={userName}
        userEmail={userEmail}
        userPicture={userPicture}
      />
      <div className="users-container">
      <h1 className="title">All Users</h1>
>>>>>>> backup/branch
      <p>
        {userName}: {userRole}
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Name</th>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Email</th>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]">Status</th>
            <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]"></th>
            {canViewFiles && <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]"></th>}
            {(userRole === "Admin" || userRole === "Owner") && <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]"></th>}
            {userRole === "Owner" && <th className="border border-[#ddd] p-3 text-left bg-[#f3f3f3]"></th>}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} className={user.isDeleted ? "bg-[#fff3cd] opacity-70" : ""}>
              <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>{user.name}</td>
              <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>{user.email}</td>
              <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>
                {user.isDeleted
                  ? "Deleted"
                  : user.isLoggedIn
                  ? "Logged In"
                  : "Logged Out"}
              </td>
              <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>
                <button
                  className="px-3 py-[6px] text-sm border-none rounded bg-[#007bff] text-white cursor-pointer transition-colors duration-200 hover:not(:disabled):bg-[#0056b3] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                  onClick={() => handleLogoutClick(user)}
                  disabled={!user.isLoggedIn || user.isDeleted}
                >
                  Logout
                </button>
              </td>

              {canViewFiles && (
                <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>
                  <button
                    className="px-3 py-[6px] text-sm border-none rounded bg-[#17a2b8] text-white cursor-pointer transition-colors duration-200 hover:not(:disabled):bg-[#138496] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                    onClick={() => handleViewClick(user)}
                    disabled={user.isDeleted}
                  >
                    View
                  </button>
                </td>
              )}

              {(userRole === "Admin" || userRole === "Owner") && (
                <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>
                  <button
                    className="px-3 py-[6px] text-sm border-none rounded bg-[#bd1839] text-white cursor-pointer transition-colors duration-200 hover:not(:disabled):bg-[#d91e1e] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                    onClick={() => handleDeleteClick(user)}
                    disabled={userEmail === user.email || user.isDeleted}
                  >
                    Delete
                  </button>
                </td>
              )}

              {userRole === "Owner" && (
                <td className={`border border-[#ddd] p-3 text-left ${user.isDeleted ? "text-[#856404]" : ""}`}>
                  <button
                    className="px-3 py-[6px] text-sm border-none rounded bg-[#28a745] text-white cursor-pointer transition-colors duration-200 hover:not(:disabled):bg-[#218838] disabled:bg-[#ccc] disabled:cursor-not-allowed"
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

      {/* FILES MODAL */}
      {showFilesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeFilesModal}>
          <div
            className="bg-white rounded-lg w-[90%] max-w-[800px] max-h-[90vh] shadow-[0_4px_6px_rgba(0,0,0,0.1)] animate-[modalFadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-[#ddd]">
              <h2 className="m-0 text-2xl">{selectedUser.name}'s Files</h2>
              <button className="bg-transparent border-none text-[28px] cursor-pointer text-[#666] p-0 w-[30px] h-[30px] flex items-center justify-center transition-colors duration-200 hover:text-black" onClick={closeFilesModal}>
                &times;
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {loadingFiles ? (
                <div className="text-center py-10 text-[#666] text-base">Loading files...</div>
              ) : userFiles.length === 0 ? (
                <p className="text-center py-10 text-[#999] text-sm">No files found for this user.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse mt-[10px]">
                    <thead>
                      <tr>
                        <th className="border border-[#e0e0e0] p-3 text-left text-sm bg-[#f8f9fa] font-semibold text-[#333] sticky top-0 z-10">File Name</th>
                        <th className="border border-[#e0e0e0] p-3 text-left text-sm bg-[#f8f9fa] font-semibold text-[#333] sticky top-0 z-10">Type</th>
                        <th className="border border-[#e0e0e0] p-3 text-left text-sm bg-[#f8f9fa] font-semibold text-[#333] sticky top-0 z-10">Size</th>
                        <th className="border border-[#e0e0e0] p-3 text-left text-sm bg-[#f8f9fa] font-semibold text-[#333] sticky top-0 z-10">Created</th>
                        {(canDeleteFiles || canRenameFiles) && <th className="border border-[#e0e0e0] p-3 text-left text-sm bg-[#f8f9fa] font-semibold text-[#333] sticky top-0 z-10">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {userFiles.map((file) => (
                        <tr key={file._id || file.id} className="hover:bg-[#f8f9fa]">
                          <td className="border border-[#e0e0e0] p-3 text-left text-sm">
                            <span
                              className="text-[#007bff] cursor-pointer no-underline transition-all duration-200 hover:text-[#0056b3] hover:underline"
                              onClick={() => {
                                setSelectedFile(file);
                                handleFileClick(file);
                              }}
                            >
                              {file.name}
                            </span>
                          </td>
                          <td className="border border-[#e0e0e0] p-3 text-left text-sm">{file.type || "File"}</td>
                          <td className="border border-[#e0e0e0] p-3 text-left text-sm">
                            {file.size
                              ? `${(file.size / 1024).toFixed(2)} KB`
                              : "N/A"}
                          </td>
                          <td className="border border-[#e0e0e0] p-3 text-left text-sm">
                            {file.createdAt
                              ? new Date(file.createdAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          {(canDeleteFiles || canRenameFiles) && (
                            <td className="border border-[#e0e0e0] p-3 text-left text-sm">
                              <div style={{ display: "flex", gap: "8px" }}>
                                {canRenameFiles && (
                                  <button
                                    className="px-[14px] py-[6px] text-[13px] border-none rounded bg-[#ffc107] text-[#333] cursor-pointer transition-all duration-200 font-medium hover:bg-[#e0a800] hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(255,193,7,0.3)]"
                                    onClick={() => handleRenameClick(file)}
                                  >
                                    Rename
                                  </button>
                                )}
                                {canDeleteFiles && (
                                  <button
                                    className="px-[14px] py-[6px] text-[13px] border-none rounded bg-[#dc3545] text-white cursor-pointer transition-all duration-200 hover:bg-[#c82333] hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(220,53,69,0.3)]"
                                    onClick={() => handleDeleteFileClick(file)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!canDeleteFiles && !canRenameFiles && (
                <div className="mt-5 p-3 bg-[#fff3cd] border-l-4 border-[#ffc107] rounded">
                  <p className="m-0 text-[#856404] text-sm font-medium">⚠️ You have read-only access to this user's files.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENAME FILE MODAL */}
      {showRenameModal && selectedFile && (
        <div
          className="modal-overlay"
          onClick={() => setShowRenameModal(false)}
        >
          <div
            className="modal-content confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Rename File</h2>
              <button
                className="modal-close"
                onClick={() => setShowRenameModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info">
                Enter new name for: <strong>{selectedFile.name}</strong>
              </p>
              <input
                type="text"
                className="rename-input"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter new file name"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    confirmRenameFile();
                  }
                }}
              />
              <div className="confirm-actions">
                <button
                  className="cancel-button"
                  onClick={() => setShowRenameModal(false)}
                >
                  Cancel
                </button>
                <button className="confirm-button" onClick={confirmRenameFile}>
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {showFilePreview && selectedFile && (
        <div
          className="modal-overlay file-preview-overlay"
          onClick={closeFilePreview}
        >
          <div
            className="modal-content file-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedFile.name}</h2>
              <button className="modal-close" onClick={closeFilePreview}>
                &times;
              </button>
            </div>
            <div className="modal-body file-preview-body">
              {getFileType(selectedFile.name) === "image" && (
                <img
                  src={previewFileUrl}
                  alt={selectedFile.name}
                  className="preview-image"
                />
              )}
              {getFileType(selectedFile.name) === "video" && (
                <video src={previewFileUrl} controls className="preview-video">
                  Your browser does not support the video tag.
                </video>
              )}
              {getFileType(selectedFile.name) === "audio" && (
                <div className="preview-audio-container">
                  <audio
                    src={previewFileUrl}
                    controls
                    className="preview-audio"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                  <p className="audio-filename">{selectedFile.name}</p>
                </div>
              )}
              {getFileType(selectedFile.name) === "pdf" && (
                <iframe
                  src={previewFileUrl}
                  className="preview-pdf"
                  title={selectedFile.name}
                />
              )}
              {getFileType(selectedFile.name) === "text" && (
                <iframe
                  src={previewFileUrl}
                  className="preview-text"
                  title={selectedFile.name}
                />
              )}
              {getFileType(selectedFile.name) === "office" && (
                <div className="preview-office">
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                      previewFileUrl
                    )}`}
                    className="preview-pdf"
                    title={selectedFile.name}
                  />
                  <div className="office-fallback">
                    <p>If preview doesn't load:</p>
                    <a
                      href={previewFileUrl}
                      download={selectedFile.name}
                      className="download-link"
                    >
                      Download {selectedFile.name}
                    </a>
                  </div>
                </div>
              )}
              {getFileType(selectedFile.name) === "download" && (
                <div className="preview-download">
                  <div className="download-icon">📄</div>
                  <p className="download-filename">{selectedFile.name}</p>
                  <p className="download-info">
                    Preview not available for this file type
                  </p>
                  <a
                    href={previewFileUrl}
                    download={selectedFile.name}
                    className="download-link"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE FILE CONFIRMATION */}
      {showDeleteFileConfirm && selectedFile && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteFileConfirm(false)}
        >
          <div
            className="modal-content confirm-modal danger-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Delete File</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteFileConfirm(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-user-info danger-text">
                Are you sure you want to delete{" "}
                <strong>{selectedFile.name}</strong>?
              </p>
              <p className="warning-text">This action cannot be undone!</p>
              <div className="confirm-actions">
                <button
                  className="cancel-button"
                  onClick={() => setShowDeleteFileConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-button danger-button"
                  onClick={confirmDeleteFile}
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXISTING MODALS */}
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
    </>
  );
}
