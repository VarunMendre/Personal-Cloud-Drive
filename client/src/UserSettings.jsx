import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { BASE_URL } from "../src/components/DirectoryHeader"
=======
import { BASE_URL } from "../src/components/DirectoryHeader";
import {
  FaGoogle,
  FaGithub,
  FaSignOutAlt,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
>>>>>>> backup/branch

function UserSettings() {
  const navigate = useNavigate();

  // User info
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPicture, setUserPicture] = useState("");

  // Storage info
  const [maxStorageLimit, setMaxStorageLimit] = useState(1073741824); // 1GB default
  const [usedStorageInBytes, setUsedStorageInBytes] = useState(0);

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calculate storage stats
  const usedGB = usedStorageInBytes / 1024 ** 3;
  const totalGB = maxStorageLimit / 1024 ** 3;
  const usagePercentage = (usedStorageInBytes / maxStorageLimit) * 100;

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user info
        const userResponse = await fetch(`${BASE_URL}/user`, {
          credentials: "include",
        });

        if (userResponse.status === 401) {
          navigate("/login");
          return;
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserName(userData.name);
          setUserEmail(userData.email);
          setUserPicture(userData.picture);
          setMaxStorageLimit(userData.maxStorageLimit);
          setUsedStorageInBytes(userData.usedStorageInBytes);

          // Detect connected provider from email domain or other logic
          // This is a simple heuristic - adjust based on your backend
          if (userData.email.includes("gmail.com")) {
            setConnectedProvider("google");
          } else if (userData.email.includes("github")) {
            setConnectedProvider("github");
          }
        }

        // Check password status
        const passwordResponse = await fetch(`${BASE_URL}/user/has-password`, {
          credentials: "include",
        });

        if (passwordResponse.ok) {
          const passwordData = await passwordResponse.json();
          setHasPassword(passwordData.hasPassword);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user settings");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [navigate]);

  // Handle password change/set
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = hasPassword
        ? "/user/change-password"
        : "/user/set-password";
      const body = hasPassword
        ? { currentPassword, newPassword }
        : { newPassword };

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          hasPassword
            ? "Password changed successfully!"
            : "Password set successfully! You can now login with email and password."
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setHasPassword(true);
      } else {
        setError(data.message || "Error updating password");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setError("Error updating password. Please try again.");
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
<<<<<<< HEAD
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
        <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-10 w-full max-w-[500px]">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (hasPassword) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
        <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-10 w-full max-w-[500px] max-[600px]:px-5 max-[600px]:py-[30px]">
          <h1 className="text-[28px] text-[#333] mb-[10px] text-center max-[600px]:text-2xl">User Settings</h1>
          <div className="bg-[#e3f2fd] text-[#1976d2] p-5 rounded-lg mb-5 text-center">
            <p className="my-2">You already have a password set up.</p>
            <p className="my-2">You can login using your email and password.</p>
          </div>
          <button className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white mt-[10px] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(102,126,234,0.4)] w-full" onClick={handleBack}>
            Back to Home
          </button>
=======
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
>>>>>>> backup/branch
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-10 w-full max-w-[500px] max-[600px]:px-5 max-[600px]:py-[30px]">
        <h1 className="text-[28px] text-[#333] mb-[10px] text-center max-[600px]:text-2xl">Set Password</h1>
        <p className="text-[#666] text-center mb-[30px] text-sm">
          Set a password to enable login with email and password
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="newPassword" className="font-semibold text-[#333] text-sm">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={4}
              disabled={submitting}
              className="px-4 py-3 border-2 border-[#e0e0e0] rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-[#f5f5f5] disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-semibold text-[#333] text-sm">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={4}
              disabled={submitting}
              className="px-4 py-3 border-2 border-[#e0e0e0] rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-[#f5f5f5] disabled:cursor-not-allowed"
            />
=======
    <div className="min-h-screen bg-gray-50 py-8">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
>>>>>>> backup/branch
          </div>
        )}

<<<<<<< HEAD
          {error && <div className="bg-[#fee] text-[#c33] px-4 py-3 rounded-lg text-sm border-l-4 border-[#c33]">{error}</div>}
          {success && <div className="bg-[#efe] text-[#3c3] px-4 py-3 rounded-lg text-sm border-l-4 border-[#3c3]">{success}</div>}

          <div className="flex gap-3 mt-[10px] max-[600px]:flex-col">
            <button
              type="button"
              className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-[#f5f5f5] text-[#666] hover:not(:disabled):bg-[#e0e0e0] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleBack}
              disabled={submitting}
=======
        {/* Storage Usage Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
>>>>>>> backup/branch
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
                {usedGB.toFixed(2)} GB of {totalGB.toFixed(2)} GB used
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
                {usedGB.toFixed(2)} GB
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Available Space</div>
              <div className="text-lg font-semibold text-gray-900">
                {(totalGB - usedGB).toFixed(2)} GB
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
                  <div className="text-sm text-gray-600">{userEmail}</div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  required
                  minLength={4}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  required
                  minLength={4}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
<<<<<<< HEAD
              className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_5px_15px_rgba(102,126,234,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
=======
>>>>>>> backup/branch
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
  );
}

export default UserSettings;
