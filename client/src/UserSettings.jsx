import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../src/components/DirectoryHeader"

function UserSettings() {
  const navigate = useNavigate();

  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if user already has a password
  useEffect(() => {
    async function checkPassword() {
      try {
        const response = await fetch(`${BASE_URL}/user/has-password`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setHasPassword(data.hasPassword);
        } else if (response.status === 401) {
          // Not logged in, redirect to login
          navigate("/login");
        } else {
          setError("Error checking password status");
        }
      } catch (err) {
        console.error("Error checking password:", err);
        setError("Error checking password status");
      } finally {
        setLoading(false);
      }
    }

    checkPassword();
  }, [navigate]);

  const handleSubmit = async (e) => {
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
      const response = await fetch(`${BASE_URL}/user/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          "Password set successfully! You can now login with email and password."
        );
        setNewPassword("");
        setConfirmPassword("");
        setHasPassword(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.message || "Error setting password");
      }
    } catch (err) {
      console.error("Error setting password:", err);
      setError("Error setting password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return (
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
        </div>
      </div>
    );
  }

  return (
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
          </div>

          {error && <div className="bg-[#fee] text-[#c33] px-4 py-3 rounded-lg text-sm border-l-4 border-[#c33]">{error}</div>}
          {success && <div className="bg-[#efe] text-[#3c3] px-4 py-3 rounded-lg text-sm border-l-4 border-[#3c3]">{success}</div>}

          <div className="flex gap-3 mt-[10px] max-[600px]:flex-col">
            <button
              type="button"
              className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-[#f5f5f5] text-[#666] hover:not(:disabled):bg-[#e0e0e0] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleBack}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-[0_5px_15px_rgba(102,126,234,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              disabled={submitting}
            >
              {submitting ? "Setting Password..." : "Set Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserSettings;
