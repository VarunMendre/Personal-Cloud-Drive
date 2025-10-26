import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../src/components/DirectoryHeader"
import "./UserSettings.css";

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
      <div className="user-settings-container">
        <div className="user-settings-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (hasPassword) {
    return (
      <div className="user-settings-container">
        <div className="user-settings-card">
          <h1>User Settings</h1>
          <div className="info-message">
            <p>You already have a password set up.</p>
            <p>You can login using your email and password.</p>
          </div>
          <button className="back-button" onClick={handleBack}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-settings-container">
      <div className="user-settings-card">
        <h1>Set Password</h1>
        <p className="subtitle">
          Set a password to enable login with email and password
        </p>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={4}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={4}
              disabled={submitting}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="button-group">
            <button
              type="button"
              className="cancel-button"
              onClick={handleBack}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
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
