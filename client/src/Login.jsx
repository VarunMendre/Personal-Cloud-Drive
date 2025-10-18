import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const BASE_URL = "http://localhost:4000";

  const [formData, setFormData] = useState({
    email: "varunmm0404@gmail.com",
    password: "1234",
  });

  // serverError will hold the error message from the server
  const [serverError, setServerError] = useState("");

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear the server error as soon as the user starts typing in either field
    if (serverError) {
      setServerError("");
    }

    // Reset OTP state when email changes
    if (name === "email") {
      setOtpError("");
      setOtpSent(false);
      setOtpVerified(false);
      setCountdown(0);
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Send OTP handler
  const handleSendOtp = async () => {
    const { email } = formData;
    if (!email) {
      setOtpError("Please enter your email first.");
      return;
    }

    try {
      setIsSending(true);
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setCountdown(60); // allow resend after 60s
        setOtpError("");
      } else {
        setOtpError(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Something went wrong sending OTP.");
    } finally {
      setIsSending(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    const { email } = formData;
    if (!otp) {
      setOtpError("Please enter OTP.");
      return;
    }

    try {
      setIsVerifying(true);
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpVerified(true);
        setOtpError("");
      } else {
        setOtpError(data.error || "Invalid or expired OTP.");
      }
    } catch (err) {
      console.error(err);
      setOtpError("Something went wrong verifying OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!otpVerified) {
      setOtpError("Please verify your email with OTP before logging in.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: "POST",
        body: JSON.stringify({...formData, otp}),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      if (data.error) {
        // If there's an error, set the serverError message
        setServerError(data.error);
      } else {
        // On success, navigate to home or any other protected route
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error);
      setServerError("Something went wrong. Please try again.");
    }
  };

  // If there's an error, we'll add "input-error" class to both fields
  const hasError = Boolean(serverError);

  return (
    <div className="container">
      <h2 className="heading">Login</h2>
      <form className="form" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Send OTP Button */}
        <div className="form-group">
          <button
            type="button"
            className="otp-send-button"
            onClick={handleSendOtp}
            disabled={isSending || !formData.email}
          >
            {isSending ? "Sending..." : "Send OTP"}
          </button>
          {countdown > 0 && (
            <p className="countdown-text">Resend OTP in {countdown}s</p>
          )}
          {otpError && !otpSent && <span className="error-msg">{otpError}</span>}
        </div>

        {/* OTP Input + Verify */}
        {otpSent && (
          <div className="form-group">
            <label htmlFor="otp" className="label">
              Enter OTP
            </label>
            <div className="otp-wrapper">
              <input
                className="input"
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="4-digit OTP"
                maxLength={4}
                required
              />
              <button
                type="button"
                className="otp-button"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpVerified}
              >
                {isVerifying
                  ? "Verifying..."
                  : otpVerified
                    ? "Verified"
                    : "Verify OTP"}
              </button>
            </div>
            {otpError && <span className="error-msg">{otpError}</span>}
          </div>
        )}

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
          {/* Absolutely-positioned error message below password field */}
          {serverError && <span className="error-msg">{serverError}</span>}
        </div>

        <button 
          type="submit" 
          className="submit-button"
          disabled={!otpVerified}
        >
          {otpVerified ? "Login" : "Verify OTP to Login"}
        </button>
      </form>

      {/* Link to the register page */}
      <p className="link-text">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
