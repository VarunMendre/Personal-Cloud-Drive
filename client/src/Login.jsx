// In Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import { GoogleLogin } from "@react-oauth/google";
import "./App.css";
import { loginWithGoogle } from "../src/apis/loginWithGoogle";
import { loginWithGitHub } from "../src/apis/loginWithGitHub";

const Login = () => {
  const BASE_URL = "http://localhost:4000";

  const [formData, setFormData] = useState({
    email: "anuragprocodrr@gmail.com",
    password: "abcd",
  });

  const [serverError, setServerError] = useState("");
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
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

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
    <div className="container">
      <h2 className="heading">Login</h2>
      <form className="form" onSubmit={handleSubmit}>
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
          {serverError && <span className="error-msg">{serverError}</span>}
        </div>

        <button type="submit" className="submit-button">
          Login
        </button>
      </form>

      <p className="link-text">
        Don't have an account? <Link to="/register">Register</Link>
      </p>

      <div className="or">
        <span>Or</span>
      </div>

      {/* Google login section */}
      <div className="google-login">
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
      <div className="github-login">
        <button onClick={loginWithGitHubHandler} className="github-button">
          Continue with GitHub
        </button>
      </div>
    </div>
  );
};

export default Login;
