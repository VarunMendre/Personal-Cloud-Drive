// import React, { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import "./Auth.css";
// import { GoogleLogin } from "@react-oauth/google";
// import { loginWithGoogle } from "../src/apis/loginWithGoogle";
// import { loginWithGitHub } from "../src/apis/loginWithGitHub";

// const Register = () => {
//   const BASE_URL = "http://localhost:4000";

//   const [formData, setFormData] = useState({
//     name: "Anurag Singh",
//     email: "anuragprocodrr@gmail.com",
//     password: "abcd",
//   });

//   const [serverError, setServerError] = useState("");
//   const [isSuccess, setIsSuccess] = useState(false);

//   // OTP state
//   const [otp, setOtp] = useState("");
//   const [otpSent, setOtpSent] = useState(false);
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [otpError, setOtpError] = useState("");
//   const [isSending, setIsSending] = useState(false);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [countdown, setCountdown] = useState(0);

//   const navigate = useNavigate();

//   // GitHub login function
//   const loginWithGitHubHandler = () => {
//     const CLIENT_ID = "Ov23lifBnGMie0EjK9Zz";
//     window.location.assign(
//       `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:5173/github-callback&scope=read:user user:email`
//     );
//   };

//   // Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "email") {
//       setServerError("");
//       setOtpError("");
//       setOtpSent(false);
//       setOtpVerified(false);
//       setCountdown(0);
//     }
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Countdown timer for resend
//   useEffect(() => {
//     if (countdown <= 0) return;
//     const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
//     return () => clearTimeout(timer);
//   }, [countdown]);

//   // Send OTP handler
//   const handleSendOtp = async () => {
//     const { email } = formData;
//     if (!email) {
//       setOtpError("Please enter your email first.");
//       return;
//     }

//     try {
//       setIsSending(true);
//       const res = await fetch(`${BASE_URL}/auth/send-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });
//       const data = await res.json();

//       if (res.ok) {
//         setOtpSent(true);
//         setCountdown(60); // allow resend after 60s
//         setOtpError("");
//       } else {
//         setOtpError(data.error || "Failed to send OTP.");
//       }
//     } catch (err) {
//       console.error(err);
//       setOtpError("Something went wrong sending OTP.");
//     } finally {
//       setIsSending(false);
//     }
//   };

//   // Verify OTP handler
//   const handleVerifyOtp = async () => {
//     const { email } = formData;
//     if (!otp) {
//       setOtpError("Please enter OTP.");
//       return;
//     }

//     try {
//       setIsVerifying(true);
//       const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, otp }),
//       });
//       const data = await res.json();

//       if (res.ok) {
//         setOtpVerified(true);
//         setOtpError("");
//       } else {
//         setOtpError(data.error || "Invalid or expired OTP.");
//       }
//     } catch (err) {
//       console.error(err);
//       setOtpError("Something went wrong verifying OTP.");
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   // Final form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setServerError("");
//     setIsSuccess(false);

//     if (!otpVerified) {
//       setOtpError("Please verify your email with OTP before registering.");
//       return;
//     }

//     try {
//       const response = await fetch(`${BASE_URL}/user/register`, {
//         method: "POST",
//         body: JSON.stringify({ ...formData, otp }),
//         headers: { "Content-Type": "application/json" },
//       });
//       const data = await response.json();

//       if (data.error || !response.ok) {
//         setServerError(
//           typeof data.error === "string"
//             ? data.error
//             : "Registration failed. Please try again."
//         );
//       } else {
//         setIsSuccess(true);
//         setTimeout(() => navigate("/"), 2000);
//       }
//     } catch (error) {
//       console.error(error);
//       setServerError("Something went wrong. Please try again.");
//     }
//   };

//   return (
//     <div className="container">
//       <h2 className="heading">Register</h2>
//       <form className="form" onSubmit={handleSubmit}>
//         {/* Name */}
//         <div className="form-group">
//           <label htmlFor="name" className="label">
//             Name
//           </label>
//           <input
//             className="input"
//             type="text"
//             id="name"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             placeholder="Enter your name"
//             required
//           />
//         </div>

//         {/* Email + Send OTP */}
//         <div className="form-group">
//           <label htmlFor="email" className="label">
//             Email
//           </label>
//           <div className="otp-wrapper">
//             <input
//               className={`input ${serverError ? "input-error" : ""}`}
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               required
//             />
//             <button
//               type="button"
//               className="otp-button"
//               onClick={handleSendOtp}
//               disabled={isSending || countdown > 0}
//             >
//               {isSending
//                 ? "Sending..."
//                 : countdown > 0
//                 ? `${countdown}s`
//                 : "Send OTP"}
//             </button>
//           </div>
//           {serverError && <span className="error-msg">{serverError}</span>}
//         </div>

//         {/* OTP Input + Verify */}
//         {otpSent && (
//           <div className="form-group">
//             <label htmlFor="otp" className="label">
//               Enter OTP
//             </label>
//             <div className="otp-wrapper">
//               <input
//                 className="input"
//                 type="text"
//                 id="otp"
//                 name="otp"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 placeholder="4-digit OTP"
//                 maxLength={4}
//                 required
//               />
//               <button
//                 type="button"
//                 className="otp-button"
//                 onClick={handleVerifyOtp}
//                 disabled={isVerifying || otpVerified}
//               >
//                 {isVerifying
//                   ? "Verifying..."
//                   : otpVerified
//                   ? "Verified"
//                   : "Verify OTP"}
//               </button>
//             </div>
//             {otpError && <span className="error-msg">{otpError}</span>}
//           </div>
//         )}

//         {/* Password */}
//         <div className="form-group">
//           <label htmlFor="password" className="label">
//             Password
//           </label>
//           <input
//             className="input"
//             type="password"
//             id="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             placeholder="Enter your password"
//             required
//           />
//         </div>

//         <button
//           type="submit"
//           className={`submit-button ${isSuccess ? "success" : ""}`}
//           disabled={!otpVerified || isSuccess}
//         >
//           {isSuccess ? "Registration Successful" : "Register"}
//         </button>
//       </form>

//       <p className="link-text">
//         Already have an account? <Link to="/login">Login</Link>
//       </p>

//       <div className="or">
//         <span>Or</span>
//       </div>

//       <div className="google-login">
//         <GoogleLogin
//           onSuccess={async(credentialResponse) => {
//             const data = await loginWithGoogle(credentialResponse.credential);
//             if (data.error) {
//               console.log(data);
//               return;
//             }
//             navigate("/");
//           }}
//           shape="pill"
//           theme="filled_blue"
//           text="continue_with"
//           onError={() => {
//             console.log("Login Failed");
//           }}
//           useOneTap
//         />
//       </div>

//       <div className="github-login">
//         <button
//           onClick={loginWithGitHubHandler}
//           className="github-button"
//         >
//           Continue with GitHub
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Register;
"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google"
import DOMPurify from "dompurify"
import { loginWithGoogle } from "../src/apis/loginWithGoogle"

const Register = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL

  const [formData, setFormData] = useState({
    name: "Anurag Singh",
    email: "anuragprocodrr@gmail.com",
    password: "abcd",
  })

  const [serverError, setServerError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  // OTP state
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const navigate = useNavigate()

  // GitHub login function
  const loginWithGitHubHandler = () => {
    const CLIENT_ID = "Ov23lifBnGMie0EjK9Zz"
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${window.location.origin}/github-callback&scope=read:user user:email`,
    )
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "email") {
      setServerError("")
      setOtpError("")
      setOtpSent(false)
      setOtpVerified(false)
      setCountdown(0)
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Send OTP handler
  const handleSendOtp = async () => {
    const { email } = formData
    if (!email) {
      setOtpError("Please enter your email first.")
      return
    }

    try {
      setIsSending(true)
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setOtpSent(true)
        setCountdown(60) // allow resend after 60s
        setOtpError("")
      } else {
        setOtpError(data.error || "Failed to send OTP.")
      }
    } catch (err) {
      console.error(err)
      setOtpError("Something went wrong sending OTP.")
    } finally {
      setIsSending(false)
    }
  }

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    const { email } = formData
    if (!otp) {
      setOtpError("Please enter OTP.")
      return
    }

    try {
      setIsVerifying(true)
      const sanitizedOtp = DOMPurify.sanitize(otp)

      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: sanitizedOtp }),
      })
      const data = await res.json()

      if (res.ok) {
        setOtpVerified(true)
        setOtpError("")
      } else {
        setOtpError(data.error || "Invalid or expired OTP.")
      }
    } catch (err) {
      console.error(err)
      setOtpError("Something went wrong verifying OTP.")
    } finally {
      setIsVerifying(false)
    }
  }

  // Final form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError("")
    setIsSuccess(false)

    if (!otpVerified) {
      setOtpError("Please verify your email with OTP before registering.")
      return
    }

    try {
      const sanitizedData = {
        name: DOMPurify.sanitize(formData.name),
        email: DOMPurify.sanitize(formData.email),
        password: DOMPurify.sanitize(formData.password),
        otp: DOMPurify.sanitize(otp),
      }

      const response = await fetch(`${BASE_URL}/user/register`, {
        method: "POST",
        body: JSON.stringify(sanitizedData),
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()

      if (data.error || !response.ok) {
        setServerError(typeof data.error === "string" ? data.error : "Registration failed. Please try again.")
      } else {
        setIsSuccess(true)
        setTimeout(() => navigate("/"), 2000)
      }
    } catch (error) {
      console.error(error)
      setServerError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="max-w-[400px] mx-auto p-5">
      <h2 className="text-center mb-5 text-2xl font-bold">Register</h2>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="relative mb-5">
          <label htmlFor="name" className="block mb-[5px] font-bold">
            Name
          </label>
          <input
            className="w-full p-2 box-border border border-[#ccc] rounded-[4px]"
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </div>

        {/* Email + Send OTP */}
        <div className="relative mb-5">
          <label htmlFor="email" className="block mb-[5px] font-bold">
            Email
          </label>
          <div className="relative">
            <input
              className={`w-full p-2 box-border border rounded-[4px] pr-[80px] ${serverError ? "border-red-500" : "border-[#ccc]"}`}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 px-2 py-1 text-xs leading-none border-none rounded-[3px] bg-[#007bff] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSendOtp}
              disabled={isSending || countdown > 0}
            >
              {isSending ? "Sending..." : countdown > 0 ? `${countdown}s` : "Send OTP"}
            </button>
          </div>
          {serverError && <span className="absolute top-full left-0 text-red-500 text-[0.7rem] mt-[2px] whitespace-nowrap">{serverError}</span>}
        </div>

        {/* OTP Input + Verify */}
        {otpSent && (
          <div className="relative mb-5">
            <label htmlFor="otp" className="block mb-[5px] font-bold">
              Enter OTP
            </label>
            <div className="relative">
              <input
                className="w-full p-2 box-border border border-[#ccc] rounded-[4px] pr-[80px]"
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
                className="absolute top-1/2 right-2 -translate-y-1/2 px-2 py-1 text-xs leading-none border-none rounded-[3px] bg-[#007bff] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpVerified}
              >
                {isVerifying ? "Verifying..." : otpVerified ? "Verified" : "Verify OTP"}
              </button>
            </div>
            {otpError && <span className="absolute top-full left-0 text-red-500 text-[0.7rem] mt-[2px] whitespace-nowrap">{otpError}</span>}
          </div>
        )}

        {/* Password */}
        <div className="relative mb-5">
          <label htmlFor="password" className="block mb-[5px] font-bold">
            Password
          </label>
          <input
            className="w-full p-2 box-border border border-[#ccc] rounded-[4px]"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          className={`bg-[#007bff] text-white border-none rounded-[4px] p-[10px_15px] w-full cursor-pointer text-[1rem] hover:opacity-90 disabled:bg-[#92a6bc] disabled:cursor-not-allowed ${isSuccess ? "bg-green-600" : ""}`}
          disabled={!otpVerified || isSuccess}
        >
          {isSuccess ? "Registration Successful" : "Register"}
        </button>
      </form>

      <p className="text-center mt-[10px]">
        Already have an account? <Link to="/login" className="text-[#0066cc] no-underline font-medium hover:underline hover:text-[#004a99]">Login</Link>
      </p>

      <div className="text-center my-5 relative">
        <span className="bg-white px-[15px] text-[#666] text-[0.9rem] relative z-10">Or</span>
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#ddd] -z-10"></div>
      </div>

      <div className="flex justify-center mt-[10px]">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const data = await loginWithGoogle(credentialResponse.credential)
            if (data && data.error) {
              console.error("Google login error:", data.error)
              setServerError(typeof data.error === "string" ? data.error : "Google login failed")
              return
            }
            if (data && data.success) {
              navigate("/")
            }
          }}
          shape="pill"
          theme="filled_blue"
          text="continue_with"
          onError={() => {
            console.log("Login Failed")
          }}
          useOneTap
        />
      </div>

      <div className="flex justify-center mt-[10px]">
        <button onClick={loginWithGitHubHandler} className="bg-[#24292e] text-white border-none rounded-md px-5 py-[10px] text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-[#1a1e22] active:bg-[#0d1117]">
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}

export default Register
