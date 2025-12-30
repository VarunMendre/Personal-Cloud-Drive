"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import DOMPurify from "dompurify";
import { loginWithGoogle } from "../src/apis/loginWithGoogle";
import { Alert, AlertTitle, AlertDescription } from "./components/lightswind/alert";
import { CheckCircle } from "lucide-react";

const Register = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "Anurag Singh",
    email: "anuragprocodrr@gmail.com",
    password: "abcd",
  });

  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // GitHub login function
  const loginWithGitHubHandler = () => {
    const CLIENT_ID = "Ov23lifBnGMie0EjK9Zz";
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${window.location.origin}/github-callback&scope=read:user user:email`
    );
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setServerError("");
      setOtpError("");
      setOtpSent(false);
      setOtpVerified(false);
      setCountdown(0);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send OTP handler
  const handleSendOtp = async () => {
    const { email, name, password } = formData;
    if (!email || !name || !password) {
      setOtpError("Please fill in all fields first.");
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
        setCountdown(60);
        setOtpError("");
        setCurrentStep(2); // Move to step 2
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
      const sanitizedOtp = DOMPurify.sanitize(otp);

      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: sanitizedOtp }),
      });
      const data = await res.json();

      if (res.ok) {
        setOtpVerified(true);
        setOtpError("");
        // Auto-submit after verification
        setTimeout(() => handleFinalSubmit(true), 500);
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

  // Final form submit
  const handleFinalSubmit = async (isVerifiedOverride = false) => {
    setServerError("");
    setIsSuccess(false);

    if (!otpVerified && !isVerifiedOverride) {
      setOtpError("Please verify your email with OTP before registering.");
      return;
    }

    try {
      const sanitizedData = {
        name: DOMPurify.sanitize(formData.name),
        email: DOMPurify.sanitize(formData.email),
        password: DOMPurify.sanitize(formData.password),
        otp: DOMPurify.sanitize(otp),
      };

      const response = await fetch(`${BASE_URL}/user/register`, {
        method: "POST",
        body: JSON.stringify(sanitizedData),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.error || !response.ok) {
        setServerError(typeof data.error === "string" ? data.error : "Registration failed. Please try again.");
        setCurrentStep(1);
        setOtpSent(false);
        setOtpVerified(false);
      } else {
        setIsSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error(error);
      setServerError("Something went wrong. Please try again.");
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
          <Alert variant="success" withIcon className="max-w-sm bg-white shadow-2xl p-8 border-t-4 border-green-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-50">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <AlertTitle size="lg" className="text-slate-900 mb-2">Registration Successful!</AlertTitle>
              <AlertDescription className="text-slate-500">Redirecting to login page...</AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* Registration Card */}
      <div className="w-full max-w-md animate-scaleIn">
        <div className="bg-white rounded-2xl shadow-strong p-8">
          {/* Header with Step Indicator */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#2E5E99' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#0D2440' }}>Create Account</h2>
            <p className="text-sm mb-4" style={{ color: '#7BA4D0' }}>
              {currentStep === 1 ? "Fill in your details to get started" : "Verify your email to complete registration"}
            </p>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    backgroundColor: currentStep >= 1 ? '#2E5E99' : '#E7F0FA',
                    color: currentStep >= 1 ? '#FFFFFF' : '#7BA4D0',
                  }}
                >
                  {currentStep > 1 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : "1"}
                </div>
                <span className="ml-2 text-xs font-semibold" style={{ color: currentStep >= 1 ? '#2E5E99' : '#7BA4D0' }}>Details</span>
              </div>
              
              <div className="w-12 h-0.5" style={{ backgroundColor: currentStep >= 2 ? '#2E5E99' : '#E7F0FA' }}></div>
              
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    backgroundColor: currentStep >= 2 ? '#2E5E99' : '#E7F0FA',
                    color: currentStep >= 2 ? '#FFFFFF' : '#7BA4D0',
                  }}
                >
                  2
                </div>
                <span className="ml-2 text-xs font-semibold" style={{ color: currentStep >= 2 ? '#2E5E99' : '#7BA4D0' }}>Verify</span>
              </div>
            </div>
          </div>

          {/* Step 1: Registration Form */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: '#0D2440' }}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5" style={{ color: '#7BA4D0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none"
                    style={{ borderColor: '#E7F0FA', backgroundColor: '#FFFFFF' }}
                    onFocus={(e) => e.target.style.borderColor = '#2E5E99'}
                    onBlur={(e) => e.target.style.borderColor = '#E7F0FA'}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#0D2440' }}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5" style={{ color: '#7BA4D0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none"
                    style={{
                      borderColor: serverError ? '#EF4444' : '#E7F0FA',
                      backgroundColor: '#FFFFFF'
                    }}
                    onFocus={(e) => e.target.style.borderColor = serverError ? '#EF4444' : '#2E5E99'}
                    onBlur={(e) => !serverError && (e.target.style.borderColor = '#E7F0FA')}
                  />
                </div>

                {serverError && (
                  <Alert variant="destructive" withIcon className="mt-4 p-3 text-xs bg-red-50/50">
                    <AlertDescription>
                      {serverError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#0D2440' }}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5" style={{ color: '#7BA4D0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    className="w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none"
                    style={{ borderColor: '#E7F0FA', backgroundColor: '#FFFFFF' }}
                    onFocus={(e) => e.target.style.borderColor = '#2E5E99'}
                    onBlur={(e) => e.target.style.borderColor = '#E7F0FA'}
                  />
                </div>
              </div>

              {/* Send Verification Code Button */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSending}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-medium hover:transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2E5E99' }}
                onMouseEnter={(e) => !isSending && (e.target.style.backgroundColor = '#254a7f')}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2E5E99'}
              >
                {isSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : "Send Verification Code"}
              </button>

              {/* Login Link */}
              <p className="text-center text-sm" style={{ color: '#0D2440' }}>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2E5E99' }}>
                  Sign In
                </Link>
              </p>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#E7F0FA' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white" style={{ color: '#7BA4D0' }}>Or register with</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      const data = await loginWithGoogle(credentialResponse.credential);
                      if (data && data.error) {
                        console.error("Google login error:", data.error);
                        setServerError(typeof data.error === "string" ? data.error : "Google login failed");
                        return;
                      }
                      if (data && data.success) {
                        navigate("/");
                      }
                    }}
                    shape="rectangular"
                    theme="outline"
                    text="continue_with"
                    width="320"
                    onError={() => console.log("Login Failed")}
                    useOneTap
                  />
                </div>

                <button
                  onClick={loginWithGitHubHandler}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 rounded-lg font-semibold transition-all duration-200 hover:shadow-soft"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E7F0FA',
                    color: '#0D2440'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#E7F0FA';
                    e.target.style.borderColor = '#7BA4D0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.borderColor = '#E7F0FA';
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">

              {/* Info Message */}
              <Alert variant="info" withIcon className="bg-blue-50/50 border-blue-200/50">
                <AlertDescription className="text-sm text-blue-700">
                  We've sent a verification code to <strong>{formData.email}</strong>
                </AlertDescription>
              </Alert>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold mb-2" style={{ color: '#0D2440' }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 4-digit code"
                  maxLength={4}
                  className="w-full px-4 py-3 border-2 rounded-lg text-center text-2xl font-bold tracking-widest transition-all duration-200 focus:outline-none"
                  style={{
                    borderColor: otpError ? '#EF4444' : '#E7F0FA',
                    backgroundColor: '#FFFFFF',
                    color: '#0D2440'
                  }}
                  onFocus={(e) => e.target.style.borderColor = otpError ? '#EF4444' : '#2E5E99'}
                  onBlur={(e) => !otpError && (e.target.style.borderColor = '#E7F0FA')}
                />

                {otpError && (
                  <Alert variant="destructive" withIcon className="mt-4 p-3 text-xs bg-red-50/50">
                    <AlertDescription>
                      {otpError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpVerified}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-medium hover:transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: otpVerified ? '#10B981' : '#2E5E99'
                }}
                onMouseEnter={(e) => !isVerifying && !otpVerified && (e.target.style.backgroundColor = '#254a7f')}
                onMouseLeave={(e) => !otpVerified && (e.target.style.backgroundColor = '#2E5E99')}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : otpVerified ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : "Verify Code"}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm" style={{ color: '#7BA4D0' }}>
                    Resend code in {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: '#2E5E99' }}
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setOtp("");
                  setOtpError("");
                  setOtpVerified(false);
                }}
                className="w-full py-2 text-sm font-semibold"
                style={{ color: '#7BA4D0' }}
              >
                ← Back to details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
