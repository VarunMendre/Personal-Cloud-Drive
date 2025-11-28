"use client";

// In Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../src/apis/loginWithGoogle";
import DOMPurify from "dompurify"; // Import DOMPurify for input sanitization

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
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:5173/github-callback&scope=read:user user:email`
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
        navigate("/"); // Navigate to home page after successful login
      }
    } catch (error) {
      console.error("Error:", error);
      setServerError("Something went wrong. Please try again.");
    }
  };

  const hasError = Boolean(serverError);

  return (
    <div className="max-w-[400px] mx-auto p-5">
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#ef4444",
            color: "white",
            padding: "16px 24px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            maxWidth: "400px",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {notification}
        </div>
      )}
      <h2 className="text-center mb-5 text-2xl font-bold">Login</h2>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="relative mb-5">
          <label htmlFor="email" className="block mb-[5px] font-bold">
            Email
          </label>
          <input
            className={`w-full p-2 box-border border rounded-[4px] ${
              hasError ? "border-red-500" : "border-[#ccc]"
            }`}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="relative mb-5">
          <label htmlFor="password" className="block mb-[5px] font-bold">
            Password
          </label>
          <input
            className={`w-full p-2 box-border border rounded-[4px] ${
              hasError ? "border-red-500" : "border-[#ccc]"
            }`}
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
          {serverError && (
            <span className="absolute top-full left-0 text-red-500 text-[0.7rem] mt-[2px] whitespace-nowrap">
              {serverError}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="bg-[#007bff] text-white border-none rounded-[4px] p-[10px_15px] w-full cursor-pointer text-[1rem] hover:opacity-90 disabled:bg-[#92a6bc] disabled:cursor-not-allowed"
        >
          Login
        </button>
      </form>

      <p className="text-center mt-[10px]">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-[#0066cc] no-underline font-medium hover:underline hover:text-[#004a99]"
        >
          Register
        </Link>
      </p>

      <div className="text-center my-5 relative">
        <span className="bg-white px-[15px] text-[#666] text-[0.9rem] relative z-10">
          Or
        </span>
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#ddd] -z-10"></div>
      </div>

      {/* Google login section */}
      <div className="flex justify-center mt-[10px]">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const data = await loginWithGoogle(credentialResponse.credential);
            if (data.error) {
              console.log(data);
              return;
            }
            navigate("/"); // Navigate to home after Google login
          }}
          shape="pill"
          theme="filled_blue"
          text="continue_with"
          onError={() => {
            console.log("Login Failed");
          }}
          useOneTap
        />
      </div>

      {/* GitHub login button */}
      <div className="flex justify-center mt-[10px]">
        <button
          onClick={loginWithGitHubHandler}
          className="bg-[#24292e] text-white border-none rounded-md px-5 py-[10px] text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-[#1a1e22] active:bg-[#0d1117]"
        >
          Continue with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
