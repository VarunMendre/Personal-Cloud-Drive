import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";
import {
  FaGoogle,
  FaGithub,
  FaSignOutAlt,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaCamera,
  FaSave,
} from "react-icons/fa";
import { Alert, AlertDescription, AlertTitle } from "./components/lightswind/alert";
import { PasswordStrengthIndicator } from "./components/lightswind/password-strength-indicator";
import { Loader2 } from "lucide-react";

function UserSettings() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Profile management
  const [profileName, setProfileName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Storage info
  const maxStorageLimit = user?.maxStorageLimit || 1073741824;
  const usedStorageInBytes = user?.usedStorageInBytes || 0;

  // Connected accounts
  const [connectedProvider, setConnectedProvider] = useState(null); // 'google' or 'github'

  // Password management
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // Global page errors
  const [passwordError, setPasswordError] = useState(""); // Password form errors
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Custom modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [pendingPasswordData, setPendingPasswordData] = useState(null);

  // Format storage size helper
  const formatStorage = (bytes) => {
    const MB = 1024 * 1024;
    const GB = 1024 * 1024 * 1024;
    
    if (bytes >= GB) {
      return `${(bytes / GB).toFixed(2)} GB`;
    } else if (bytes >= MB) {
      return `${(bytes / MB).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${bytes} B`;
    }
  };

  // Calculate storage stats
  const usagePercentage = (usedStorageInBytes / maxStorageLimit) * 100;

  // Fetch user data on mount (only for non-global data like password status)
  useEffect(() => {
    async function fetchAdditionalUserData() {
      if (!user) return;

      try {
        // Check password status from backend
        const passwordResponse = await fetch(`${BASE_URL}/user/has-password`, {
          credentials: "include",
        });

        let passwordStatus = false;
        if (passwordResponse.ok) {
          const passwordData = await passwordResponse.json();
          passwordStatus = passwordData.hasPassword;
        }

        // WORKAROUND REMOVED: Now relying on backend source of truth
        
        setHasPassword(passwordStatus);

        // Detect connected provider
        const isGoogleImage = user.picture?.includes("googleusercontent.com");
        const isGithubImage = user.picture?.includes("githubusercontent.com") || user.picture?.includes("avatars.github");

        if (!passwordStatus && user.picture) {
          if (user.email.includes("@gmail.com") || user.email.includes("@googlemail.com") || isGoogleImage) {
            setConnectedProvider("google");
          } else if (user.email.includes("@users.noreply.github.com") || user.email.includes("github") || isGithubImage) {
            setConnectedProvider("github");
          } else {
            setConnectedProvider("google");
          }
        } else if (user.picture) {
          if (user.email.includes("@gmail.com") || user.email.includes("@googlemail.com") || isGoogleImage) {
            setConnectedProvider("google");
          } else if (user.email.includes("@users.noreply.github.com") || user.email.includes("github") || isGithubImage) {
            setConnectedProvider("github");
          }
        }
      } catch (err) {
        console.error("Error fetching additional user data:", err);
        setError("Failed to load some settings");
      } finally {
        setLoading(false);
      }
    }

    fetchAdditionalUserData();
  }, [user]);

  // Sync profile state when user data is available
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePicture(user.picture || "");
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch(`${BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: profileName,
          picture: profilePicture,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfileSuccess("Profile updated successfully!");
        refreshUser(); // Refresh global user state
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        setProfileError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileError("Network error. Please try again.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle local file upload for profile picture
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file.");
      setTimeout(() => setProfileError(""), 4000);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("File size exceeds 2MB limit.");
      setTimeout(() => setProfileError(""), 4000);
      return;
    }

    setUpdatingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      // 1. Get signed URL
      const res = await fetch(`${BASE_URL}/user/profile/picture-upload-url?contentType=${file.type}&filename=${file.name}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key } = await res.json();

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      if (!uploadRes.ok) throw new Error("Upload to storage failed");

      // 3. Update profile with the new S3 key
      const updateRes = await fetch(`${BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          picture: key,
        }),
      });

      const data = await updateRes.json();

      if (updateRes.ok) {
        setProfileSuccess("Profile picture updated successfully!");
        refreshUser(); // Refresh global user state
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        setProfileError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile picture upload error:", err);
      setProfileError("Network error. Please try again.");
    } finally {
      setUpdatingProfile(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Handle password change/set
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setSuccess("");

    // Validation
    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters long");
      setTimeout(() => setPasswordError(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setTimeout(() => setPasswordError(""), 3000);
      return;
    }

    // Store data and show custom confirmation modal
    const dataToStore = { currentPassword, newPassword };
    console.log("=== PASSWORD FORM SUBMISSION ===");
    console.log("hasPassword:", hasPassword);
    console.log("currentPassword:", currentPassword);
    console.log("newPassword:", newPassword);
    console.log("confirmPassword:", confirmPassword);
    console.log("Data to store:", dataToStore);
    
    setPendingPasswordData(dataToStore);
    setShowConfirmModal(true);
  };

  // Actual password change after confirmation
  const confirmPasswordChange = async () => {
    setShowConfirmModal(false);
    
    // Validate pending data exists
    if (!pendingPasswordData) {
      setPasswordError("Error: No password data found. Please try again.");
      setTimeout(() => setPasswordError(""), 3000);
      return;
    }
    
    setSubmitting(true);

    try {
      const endpoint = hasPassword ? "/user/change-password" : "/user/set-password";
      const body = hasPassword
        ? { currentPassword: pendingPasswordData.currentPassword, newPassword: pendingPasswordData.newPassword }
        : { newPassword: pendingPasswordData.newPassword };

      console.log("Sending request to:", `${BASE_URL}${endpoint}`);
      console.log("Request body:", body);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      console.log("Response status:", response.status);
      
      // Handle rate limiting (429) - returns plain text, not JSON
      if (response.status === 429) {
        const errorText = await response.text();
        setPasswordError(errorText || "Too many password change attempts. Please try again later.");
        setTimeout(() => setPasswordError(""), 5000);
        setSubmitting(false);
        return;
      }
      
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        const successMessage = hasPassword
          ? "Password changed successfully!"
          : "Password set successfully! You can now login with email and password.";
        
        setSuccess(successMessage);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setHasPassword(true);
        
        // Store password status in localStorage
        localStorage.setItem(`hasPassword_${user?.email}`, 'true');
        
        // Show custom success notification
        setShowSuccessNotification(true);
        
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
          setSuccess("");
        }, 4000);
      } else {
        // Show the actual error from backend
        const errorMessage = data.message || data.error || "Error updating password";
        setPasswordError(errorMessage);
        // Auto-dismiss after 3 seconds
        setTimeout(() => setPasswordError(""), 3000);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError(`Network error: ${err.message}. Please try again.`);
      // Auto-dismiss after 3 seconds
      setTimeout(() => setPasswordError(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Logout from current device
  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      // If success (204) OR Unauthorized (401 - means already logged out)
      if (response.ok || response.status === 401) {
        navigate("/login");
      } else {
        setError("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Even if network error, maybe we should let them go? 
      // For now keeping consistent with error reporting but usually logout should be aggressive.
      setError("Logout failed");
    }
  };

  // Logout from all devices
  const handleLogoutAll = async () => {
    try {
      const response = await fetch(`${BASE_URL}/user/logout-all`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        navigate("/login");
      } else {
        setError("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DirectoryHeader
        directoryName="Settings"
        path={[]}
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture}
      />
      <div className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Home</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>


        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive" withIcon dismissible onDismiss={() => setError("")} className="mb-6 bg-white shadow-sm">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success" withIcon dismissible onDismiss={() => setSuccess("")} className="mb-6 bg-white shadow-sm">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Settings Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <FaUser className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Settings
            </h2>
          </div>

          {profileError && (
            <Alert variant="destructive" withIcon dismissible onDismiss={() => setProfileError("")} duration={5000} className="mb-4 bg-white shadow-sm">
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
          )}
          {profileSuccess && (
            <Alert variant="success" withIcon dismissible onDismiss={() => setProfileSuccess("")} duration={4000} className="mb-4 bg-white shadow-sm">
              <AlertDescription>{profileSuccess}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Profile Picture Display */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md">
                      <FaUser className="w-10 h-10 text-blue-500" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full border-2 border-white shadow-sm">
                    <FaCamera className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('profileInput').click()}
                      disabled={updatingProfile}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      <FaCamera className="w-3.5 h-3.5" />
                      Upload New Picture
                    </button>
                    <input 
                      id="profileInput"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">OR URL:</span>
                      <input
                        type="url"
                        value={profilePicture}
                        onChange={(e) => setProfilePicture(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="pname" className="block text-sm font-semibold text-gray-900">
                Full Name
              </label>
              <input
                type="text"
                id="pname"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Varun Mendre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Email Field (Disabled) */}
            <div className="space-y-2 opacity-70">
              <label className="block text-sm font-semibold text-gray-900">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-2 border border-blue-50 bg-blue-50/30 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Email cannot be changed once set.
              </p>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-full md:w-auto"
            >
              {updatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  Update Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Storage Usage Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">
              Storage Usage
            </h2>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatStorage(usedStorageInBytes)} of {formatStorage(maxStorageLimit)} used
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  usagePercentage > 90
                    ? "bg-red-100 text-red-700"
                    : usagePercentage > 70
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {usagePercentage.toFixed(1)}% used
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercentage > 90
                    ? "bg-red-500"
                    : usagePercentage > 70
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-600">Used Space</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatStorage(usedStorageInBytes)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Available Space</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatStorage(maxStorageLimit - usedStorageInBytes)}
              </div>
            </div>
          </div>

          {/* Debug Info - Shows raw byte values */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Raw Used (bytes):</span>
                <span className="font-mono">{usedStorageInBytes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Raw Limit (bytes):</span>
                <span className="font-mono">{maxStorageLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Percentage:</span>
                <span className="font-mono">{usagePercentage.toFixed(4)}%</span>
              </div>
            </div>
          </div>

          {usagePercentage > 90 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ Your storage is almost full. Consider deleting some files or
                upgrading your plan.
              </p>
            </div>
          )}

          {usagePercentage < 10 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Storage is healthy</span>
            </div>
          )}
        </div>

        {/* Connected Account Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Connected Account
          </h2>

          {connectedProvider ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                {connectedProvider === "google" ? (
                  <FaGoogle className="w-8 h-8 text-red-500" />
                ) : (
                  <FaGithub className="w-8 h-8 text-gray-900" />
                )}
                <div>
                  <div className="font-semibold text-gray-900 capitalize">
                    {connectedProvider}
                  </div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Connected
              </span>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
              No connected social account
            </div>
          )}

          <p className="mt-3 text-sm text-gray-600">
            Only one social account can be connected at a time. This account is
            used for authentication.
          </p>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">
              {hasPassword ? "Change Password" : "Set Password"}
            </h2>
          </div>

          <p className="text-gray-600 mb-6">
            {hasPassword
              ? "Update your password for manual login access."
              : "Set a password to enable login with email and password."}
          </p>


          {/* Password-specific error message */}
          {passwordError && (
            <Alert variant="destructive" withIcon className="mb-4 bg-white shadow-sm">
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {hasPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <PasswordStrengthIndicator
                value={newPassword}
                onChange={(value) => setNewPassword(value)}
                label="New Password"
                placeholder="Enter new password"
                showScore={true}
                showScoreNumber={false}
                showVisibilityToggle={true}
                inputProps={{
                  required: true,
                  minLength: 4,
                  disabled: submitting,
                }}
              />
            </div>

            <div>
              <PasswordStrengthIndicator
                value={confirmPassword}
                compareValue={newPassword}
                onChange={(value) => setConfirmPassword(value)}
                label="Confirm New Password"
                placeholder="Confirm new password"
                showScore={true}
                showScoreNumber={false}
                showVisibilityToggle={true}
                inputProps={{
                  required: true,
                  minLength: 4,
                  disabled: submitting,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting
                ? hasPassword
                  ? "Changing Password..."
                  : "Setting Password..."
                : hasPassword
                ? "Change Password"
                : "Set Password"}
            </button>
          </form>
        </div>

        {/* Logout Options Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FaSignOutAlt className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Logout Options
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Current Device Logout */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <FaSignOutAlt className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Current Device
                  </h3>
                  <p className="text-sm text-gray-600">
                    Logout from this device only
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Logout
              </button>
            </div>

            {/* All Devices Logout */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FaSignOutAlt className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">All Devices</h3>
                  <p className="text-sm text-gray-600">
                    Logout from all devices
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogoutAll}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Logout All
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {hasPassword ? "Change Password?" : "Set Password?"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {hasPassword 
                ? "Are you sure you want to change your password? You'll need to use the new password to login." 
                : "Are you sure you want to set a password for your account? You'll be able to login with email and password."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmPasswordChange}
                className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Custom Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-24 right-6 z-50 max-w-sm w-full md:w-[380px]">
          <Alert variant="success" withIcon duration={4000} dismissible onDismiss={() => setShowSuccessNotification(false)} className="bg-white/95 backdrop-blur-md shadow-2xl border-green-100">
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export default UserSettings;
