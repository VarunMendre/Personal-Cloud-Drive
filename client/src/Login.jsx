"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../src/apis/loginWithGoogle";
import DOMPurify from "dompurify";
import { Cloud, Mail, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./components/lightswind/alert";

const Login = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [formData, setFormData] = useState({
    email: "varunmm0404@gmail.com",
    password: "Varun@786",
  });

  const [serverError, setServerError] = useState("");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center p-4">

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 max-w-sm w-full md:w-[380px]">
          <Alert variant="destructive" withIcon duration={4000} dismissible onDismiss={() => setNotification("")} className="bg-white/95 backdrop-blur-md shadow-2xl border-red-100">
            <AlertDescription className="font-medium">
              {notification}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-md animate-scaleIn">
        <div className="bg-white rounded-2xl shadow-strong p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#66B2D6' }}>
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C3E50' }}>Welcome Back</h2>
            <p className="text-sm" style={{ color: '#A3C5D9' }}>Sign in to access your cloud storage</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5" style={{ color: '#A7DDE9' }} />
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
                    borderColor: hasError ? '#EF4444' : '#E6FAF5',
                    backgroundColor: '#FFFFFF',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#66B2D6'}
                  onBlur={(e) => !hasError && (e.target.style.borderColor = '#E6FAF5')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#2C3E50' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5" style={{ color: '#A7DDE9' }} />
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
                    borderColor: hasError ? '#EF4444' : '#E6FAF5',
                    backgroundColor: '#FFFFFF',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#66B2D6'}
                  onBlur={(e) => !hasError && (e.target.style.borderColor = '#E6FAF5')}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-medium hover:transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: '#66B2D6' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5aa0c0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#66B2D6'}
            >
              Sign In
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm" style={{ color: '#2C3E50' }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: '#66B2D6' }}
            >
              Create Account
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#E6FAF5' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white" style={{ color: '#A3C5D9' }}>Or continue with</span>
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
                borderColor: '#E6FAF5',
                color: '#2C3E50'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F0F8FF';
                e.target.style.borderColor = '#A7DDE9';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.borderColor = '#E6FAF5';
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
