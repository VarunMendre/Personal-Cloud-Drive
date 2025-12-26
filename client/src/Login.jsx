"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../src/apis/loginWithGoogle";
import DOMPurify from "dompurify";

const Login = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [formData, setFormData] = useState({
    email: "varunmm0404@gmail.com",
    password: "Varun@786",
  });

  const [serverError, setServerError] = useState("");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  // GitHub login function
  const loginWithGitHubHandler = () => {
    const CLIENT_ID = "Ov23lifBnGMie0EjK9Zz";
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${window.location.origin}/github-callback&scope=read:user user:email`
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (serverError) {
      setServerError("");
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const sanitizedBody = {
        email: DOMPurify.sanitize(formData.email),
        password: DOMPurify.sanitize(formData.password),
      };

      const response = await fetch(`${BASE_URL}/user/login`, {
        method: "POST",
        body: JSON.stringify(sanitizedBody),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 403) {
        setNotification(
          "This account has been deleted. Please contact support for assistance."
        );
        setTimeout(() => {
          setNotification("");
        }, 5000);
        return;
      }

      const data = await response.json();
      if (data.error) {
        setServerError(data.error);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error);
      setServerError("Something went wrong. Please try again.");
    }
  };

  const hasError = Boolean(serverError);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#E7F0FA' }}>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-slideInRight">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-strong flex items-start gap-3 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{notification}</p>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-md animate-scaleIn">
        <div className="bg-white rounded-2xl shadow-strong p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#2E5E99' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#0D2440' }}>Welcome Back</h2>
            <p className="text-sm" style={{ color: '#7BA4D0' }}>Sign in to access your cloud storage</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                    borderColor: hasError ? '#EF4444' : '#E7F0FA',
                    backgroundColor: '#FFFFFF',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2E5E99'}
                  onBlur={(e) => !hasError && (e.target.style.borderColor = '#E7F0FA')}
                />
              </div>
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
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none"
                  style={{
                    borderColor: hasError ? '#EF4444' : '#E7F0FA',
                    backgroundColor: '#FFFFFF',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2E5E99'}
                  onBlur={(e) => !hasError && (e.target.style.borderColor = '#E7F0FA')}
                />
              </div>
              {serverError && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-fadeIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {serverError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-medium hover:transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: '#2E5E99' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#254a7f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2E5E99'}
            >
              Sign In
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm" style={{ color: '#0D2440' }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: '#2E5E99' }}
            >
              Create Account
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#E7F0FA' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white" style={{ color: '#7BA4D0' }}>Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const data = await loginWithGoogle(credentialResponse.credential);
                  if (data.error) {
                    console.log(data);
                    return;
                  }
                  navigate("/");
                }}
                shape="rectangular"
                theme="outline"
                text="continue_with"
                width="320"
                onError={() => {
                  console.log("Login Failed");
                }}
                useOneTap
              />
            </div>

            {/* GitHub Login Button */}
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
      </div>
    </div>
  );
};

export default Login;
