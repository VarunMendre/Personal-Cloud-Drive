import { rateLimit } from "express-rate-limit";

const _15Minute = 15 * 60 * 1000;
const _10Minute = 10 * 60 * 1000;
const _5Minute = 5 * 60 * 1000;
const _1Minute = 1 * 60 * 1000;

/*Creates a reusable rate limiter middleware that limits requests per IP (supports both IPv4 & IPv6) with customizable window, limit, and message.*/
const createRateLimiter = ({
  windowMs = _15Minute,
  limit = 100,
  ipv6Subnet = 56,
  legacyHeaders = false,
  message = "Too many requests, please try again later",
}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders,
    message,
  });
};

// Defines per-route rate limiter settings
// Format: [windowMs, limit, ipv6Subnet, legacyHeaders, message]
const limiterConfig = {
  // ========== AUTH ROUTES ==========
  // OTP operations - very restrictive due to potential abuse
  sendOtp: [
    _5Minute,
    2,
    56,
    false,
    "Too many send-otp attempts. Please try again later",
  ],
  verifyOtp: [
    _5Minute,
    5,
    56,
    false,
    "Too many OTP verification attempts. Please try again later",
  ],

  // OAuth login - moderate limits (users might retry on failure)
  googleLogin: [
    _15Minute,
    10,
    56,
    false,
    "Too many Google login attempts. Please try again later",
  ],
  githubLogin: [
    _15Minute,
    10,
    56,
    false,
    "Too many GitHub login attempts. Please try again later",
  ],

  // ========== USER ROUTES ==========
  // Registration and login - restrictive to prevent brute force
  register: [
    _15Minute,
    5,
    56,
    false,
    "Too many registration attempts. Please try again later",
  ],
  login: [
    _15Minute,
    10,
    56,
    false,
    "Too many login attempts. Please try again later",
  ],

  // Password operations - very restrictive
  setPassword: [
    _15Minute,
    3,
    56,
    false,
    "Too many password change attempts. Please try again later",
  ],

  // Logout operations - generous (legitimate users might logout frequently)
  logout: [_5Minute, 20, 56, false, "Too many logout requests"],
  logoutAll: [
    _15Minute,
    5,
    56,
    false,
    "Too many logout-all requests. Please try again later",
  ],

  // Admin operations - moderate limits
  getAllUsers: [
    _5Minute,
    30,
    56,
    false,
    "Too many requests to view users. Please slow down",
  ],
  logoutById: [
    _5Minute,
    10,
    56,
    false,
    "Too many logout requests. Please slow down",
  ],
  deleteUser: [
    _15Minute,
    20,
    56,
    false,
    "Too many user deletion requests. Please slow down",
  ],
  hardDeleteUser: [
    _15Minute,
    10,
    56,
    false,
    "Too many hard delete requests. Please slow down",
  ],
  recoverUser: [
    _15Minute,
    15,
    56,
    false,
    "Too many user recovery requests. Please slow down",
  ],
  updateUserRole: [
    _15Minute,
    20,
    56,
    false,
    "Too many role update requests. Please slow down",
  ],

  // User file operations (Owner/Admin viewing other users' files)
  getUserFiles: [
    _5Minute,
    50,
    56,
    false,
    "Too many requests to view user files. Please slow down",
  ],
  deleteUserFiles: [
    _10Minute,
    30,
    56,
    false,
    "Too many file deletion requests. Please slow down",
  ],
  getUserFileView: [
    _5Minute,
    100,
    56,
    false,
    "Too many file view requests. Please slow down",
  ],
  updateUserFile: [
    _10Minute,
    50,
    56,
    false,
    "Too many file update requests. Please slow down",
  ],

  // ========== DIRECTORY ROUTES ==========
  // Read operations - generous (users browse frequently)
  getDirectory: [
    _5Minute,
    100,
    56,
    false,
    "Too many directory requests. Please slow down",
  ],

  // Write operations - moderate limits
  createDirectory: [
    _5Minute,
    30,
    56,
    false,
    "Too many directory creation requests. Please slow down",
  ],
  renameDirectory: [
    _5Minute,
    50,
    56,
    false,
    "Too many rename requests. Please slow down",
  ],
  deleteDirectory: [
    _10Minute,
    30,
    56,
    false,
    "Too many deletion requests. Please slow down",
  ],

  // ========== FILE ROUTES ==========
  // File uploads - moderate
  uploadFile: [
    _5Minute,
    20,
    56,
    false,
    "Too many file uploads. Please slow down",
  ],

  // File downloads/views - generous (users might view files frequently)
  getFile: [
    _5Minute,
    100,
    56,
    false,
    "Too many file requests. Please slow down",
  ],

  // File modifications - moderate
  renameFile: [
    _5Minute,
    50,
    56,
    false,
    "Too many file rename requests. Please slow down",
  ],
  deleteFile: [
    _10Minute,
    40,
    56,
    false,
    "Too many file deletion requests. Please slow down",
  ],
};

//Creates and exports an object of rate limiters by looping through limiterConfig
export const rateLimiters = Object.fromEntries(
  Object.entries(limiterConfig).map(
    ([key, [windowMs, limit, ipv6Subnet, legacyHeaders, message]]) => [
      key,
      createRateLimiter({
        windowMs,
        limit,
        ipv6Subnet,
        legacyHeaders,
        message,
      }),
    ]
  )
);

export { _15Minute, _10Minute, _5Minute, _1Minute };
