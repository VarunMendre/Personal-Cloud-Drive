import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import DirectoryHeader, { BASE_URL } from "./components/DirectoryHeader";
import {
  ArrowLeft,
  Upload,
  Eye,
  EyeOff,
  LogOut,
  Camera,
  Edit3,
  Save,
  X,
  Shield,
  User,
  Lock,
  Bell,
  HardDrive,
  ChevronDown,
} from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

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

  // Tab navigation
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      setTempName(user.name || "");
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

  // Handle inline name edit
  const handleSaveName = async () => {
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
          name: tempName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfileName(tempName);
        setIsEditingName(false);
        setProfileSuccess("Name updated successfully!");
        refreshUser();
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        setProfileError(data.error || "Failed to update name");
      }
    } catch (err) {
      console.error("Name update error:", err);
      setProfileError("Network error. Please try again.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(profileName);
    setIsEditingName(false);
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

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // Handle rate limiting (429) - returns plain text, not JSON
      if (response.status === 429) {
        const errorText = await response.text();
        setPasswordError(errorText || "Too many password change attempts. Please try again later.");
        setTimeout(() => setPasswordError(""), 5000);
        setSubmitting(false);
        return;
      }
      
      const data = await response.json();

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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header - Responsive */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button 
                onClick={() => navigate("/")}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 truncate">Settings</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
                  Manage your account and preferences
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex items-center gap-1 sm:gap-2 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Mobile/Tablet Navigation - Dropdown */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors duration-200"
            >
              <span className="font-medium text-slate-900 text-sm">
                {tabs.find((t) => t.id === activeTab)?.label || "Select Section"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${mobileMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {mobileMenuOpen && (
              <div className="mt-2 space-y-2 bg-white rounded-lg border border-slate-200 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Sidebar - Navigation tabs */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="space-y-2 sticky top-24">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}

              {/* Quick Stats */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Account Info</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Account Status</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">Active</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Member Since</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">Jan 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Responsive */}
          <div className="col-span-1 lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Error/Success Messages */}
                {profileError && (
                  <Alert variant="destructive" withIcon dismissible onDismiss={() => setProfileError("")} className="bg-white shadow-sm">
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}
                {profileSuccess && (
                  <Alert variant="success" withIcon dismissible onDismiss={() => setProfileSuccess("")} className="bg-white shadow-sm">
                    <AlertDescription>{profileSuccess}</AlertDescription>
                  </Alert>
                )}

                {/* Profile Card - Responsive */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="relative group">
                        <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl sm:text-3xl font-semibold shadow-lg transition-all duration-200 overflow-hidden">
                          {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span>{profileName?.[0]?.toUpperCase() || "U"}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full border-2 border-white shadow-sm">
                          <Camera className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <button 
                        onClick={() => document.getElementById('profileInput').click()}
                        disabled={updatingProfile}
                        className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Change Photo</span>
                        <span className="sm:hidden">Change</span>
                      </button>
                      <input 
                        id="profileInput"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Name & Info Section */}
                    <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                      <div className="mb-4 sm:mb-6">
                        {!isEditingName ? (
                          <div className="flex items-center justify-center sm:justify-start gap-2 group">
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{profileName}</h2>
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded-lg transition-all duration-200"
                            >
                              <Edit3 className="w-4 h-4 text-slate-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 text-sm sm:text-base"
                              autoFocus
                              disabled={updatingProfile}
                            />
                            <button
                              onClick={handleSaveName}
                              disabled={updatingProfile}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50"
                            >
                              {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updatingProfile}
                              className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors duration-200 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
                          <p className="text-sm sm:text-base text-slate-900 mt-1">{user?.email}</p>
                        </div>
                        {connectedProvider && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Connected Account</p>
                            <div className="flex items-center gap-2 mt-1">
                              {connectedProvider === "google" ? (
                                <FaGoogle className="w-4 h-4 text-red-500" />
                              ) : (
                                <FaGithub className="w-4 h-4 text-gray-900" />
                              )}
                              <span className="text-sm sm:text-base text-slate-900 capitalize">{connectedProvider}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Information Form - Responsive */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">
                    Profile Information
                  </h3>

                  <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed text-sm sm:text-base"
                      />
                      <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">Bio</label>
                      <textarea
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 text-sm sm:text-base"
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={updatingProfile}
                      className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab - Responsive */}
            {activeTab === "security" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6 sm:mb-8">
                    <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0 sm:mt-1" />
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                        {hasPassword ? "Change Password" : "Set Password"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {hasPassword 
                          ? "Change your password regularly to keep your account secure"
                          : "Set a password to enable login with email and password"}
                      </p>
                    </div>
                  </div>

                  {/* Password-specific error message */}
                  {passwordError && (
                    <Alert variant="destructive" withIcon className="mb-4 bg-white shadow-sm">
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4">
                    {hasPassword && (
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base pr-10"
                            required
                            disabled={submitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                      className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting
                        ? hasPassword
                          ? "Changing Password..."
                          : "Setting Password..."
                        : hasPassword
                        ? "Update Password"
                        : "Set Password"}
                    </button>
                  </form>
                </div>

                {/* Two-Factor Authentication */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Two-Factor Authentication</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-xs sm:text-sm">
                      Enable
                    </button>
                  </div>
                </div>

                {/* Logout Options */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Logout Options</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Current Device Logout */}
                    <div className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <LogOut className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">Current Device</h4>
                          <p className="text-xs text-slate-600">Logout from this device only</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
                      >
                        Logout
                      </button>
                    </div>

                    {/* All Devices Logout */}
                    <div className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">All Devices</h4>
                          <p className="text-xs text-slate-600">Logout from all devices</p>
                        </div>
                      </div>
                      <button
                        onClick={handleLogoutAll}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                      >
                        Logout All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Tab - Responsive */}
            {activeTab === "storage" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">Storage Usage</h3>

                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-2xl sm:text-3xl font-semibold text-slate-900">{formatStorage(usedStorageInBytes)}</span>
                        <span className="text-xs sm:text-sm text-slate-500">of {formatStorage(maxStorageLimit)}</span>
                      </div>
                      <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                          style={{ width: usagePercentage === 0 ? "2%" : `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500">
                          Free: {formatStorage(maxStorageLimit - usedStorageInBytes)}
                        </span>
                        <span className="text-xs font-semibold text-blue-600">{usagePercentage.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs sm:text-sm text-blue-900">
                        You have plenty of storage available. Upgrade your plan to get more space.
                      </p>
                    </div>

                    <button className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base">
                      Upgrade Storage
                    </button>
                  </div>
                </div>

                {/* Storage Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">Storage Breakdown</h3>

                  <div className="space-y-3">
                    {[
                      { label: "Documents", value: "2.5 GB", color: "bg-blue-500" },
                      { label: "Media", value: "5.2 GB", color: "bg-cyan-500" },
                      { label: "Archives", value: "1.8 GB", color: "bg-teal-500" },
                      { label: "Other", value: "0.5 GB", color: "bg-slate-400" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 sm:p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                          <span className="text-xs sm:text-sm text-slate-700">{item.label}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab - Responsive */}
            {activeTab === "notifications" && (
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">
                    Notification Preferences
                  </h3>

                  <div className="space-y-3">
                    {[
                      { label: "Account Updates", description: "Get notified about important account changes" },
                      { label: "Security Alerts", description: "Be alerted of suspicious activity" },
                      { label: "Storage Warnings", description: "Notify when storage is running low" },
                      { label: "Marketing Emails", description: "Receive updates about new features" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start sm:items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors duration-200 gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{item.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={idx < 3}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0 mt-1 sm:mt-0"
                        />
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-sm sm:text-base">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
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
