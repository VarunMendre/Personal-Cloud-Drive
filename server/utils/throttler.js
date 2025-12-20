import redisClient from "../config/redis.js";

const _2Second = 2000;
const _1Second = 1000;
const _500MS = 500;
const _3Second = 3000;
const _5Second = 5000;

const createThrottler = ({
  waitTime = _2Second,
  ttl = 60,
  allowedRequest = 1,
  burstWindow = 10000,
}) => {
  return async (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection.remoteAddress;
    const redisKey = `throttle:${ip}:${req.originalUrl}`;

    try {
      const throttleData = await redisClient.get(redisKey);

      // Get throttle data from Redis
      let previousDelay = 0;
      let lastRequest = now - waitTime;
      let requestCount = 0;
      let windowStart = now;

      if (throttleData) {
        const parsed = JSON.parse(throttleData);
        previousDelay = parsed.previousDelay || 0;
        lastRequest = parsed.lastRequest || now - waitTime;
        requestCount = parsed.requestCount || 0;
        windowStart = parsed.windowStart || now;
      }

      // Reset counter if burst window has passed
      if (now - windowStart > burstWindow) {
        requestCount = 0;
        windowStart = now;
      }

      requestCount++;

      // Calculate delay only if allowedRequests threshold is exceeded
      let delay = 0;
      if (requestCount > allowedRequest) {
        const timePassed = now - lastRequest;
        delay = Math.max(0, waitTime + previousDelay - timePassed);
      }

      // Store updated throttle data in Redis
      await redisClient.setEx(
        redisKey,
        ttl,
        JSON.stringify({
          previousDelay: delay,
          lastRequest: now,
          requestCount,
          windowStart,
        })
      );

      // Apply throttling delay
      if (delay > 0) {
        setTimeout(next, delay);
      } else {
        next();
      }
    } catch (err) {
      console.error("Redis throttling error:", err);
      next();
    }
  };
};

const throttleConfig = {
  // ========== AUTH ROUTES ==========
  // OTP operations - very restrictive (security-critical)
  sendOtp: [_5Second, 300, 1, 10000], // 5s delay, 1 free req, 10s window
  verifyOtp: [_3Second, 300, 2, 10000], // 3s delay, 2 free req, 10s window

  // OAuth login - moderate throttling (users may retry)
  googleLogin: [_2Second, 120, 3, 15000], // 2s delay, 3 free req, 15s window
  githubLogin: [_2Second, 120, 3, 15000], // 2s delay, 3 free req, 15s window

  // ========== USER ROUTES ==========
  // Registration and login - security-focused but allow retries
  register: [_3Second, 180, 2, 20000], // 3s delay, 2 free req, 20s window
  login: [_2Second, 180, 3, 20000], // 2s delay, 3 free req, 20s window

  // Password operations - high security, minimal retries
  setPassword: [_3Second, 300, 1, 15000], // 3s delay, 1 free req, 15s window
  changePassword: [_3Second, 300, 1, 15000], // 3s delay, 1 free req, 15s window

  // Logout operations - very permissive
  logout: [_500MS, 60, 10, 30000], // 500ms delay, 10 free req, 30s window
  logoutAll: [_1Second, 120, 5, 30000], // 1s delay, 5 free req, 30s window

  // User info retrieval - light throttling, frequent access expected
  getCurrentUser: [_500MS, 60, 10, 30000], // 500ms delay, 10 free req, 30s window
  getUserPassword: [_1Second, 60, 5, 20000], // 1s delay, 5 free req, 20s window

  // Admin operations - moderate throttling
  getAllUsers: [_1Second, 120, 5, 30000], // 1s delay, 5 free req, 30s window
  logoutById: [_1Second, 120, 5, 30000], // 1s delay, 5 free req, 30s window
  deleteUser: [_2Second, 180, 3, 30000], // 2s delay, 3 free req, 30s window
  hardDeleteUser: [_3Second, 300, 2, 60000], // 3s delay, 2 free req, 60s window (very destructive)
  recoverUser: [_2Second, 180, 3, 30000], // 2s delay, 3 free req, 30s window
  updateUserRole: [_2Second, 180, 3, 30000], // 2s delay, 3 free req, 30s window
  permissionPage: [_1Second, 120, 5, 30000], // 1s delay, 5 free req, 30s window

  // User file operations (Owner/Admin viewing others' files)
  getUserFiles: [_500MS, 60, 10, 30000], // 500ms delay, 10 free req, 30s window
  deleteUserFiles: [_2Second, 180, 5, 30000], // 2s delay, 5 free req, 30s window
  getUserFileView: [_500MS, 60, 15, 30000], // 500ms delay, 15 free req, 30s window
  updateUserFile: [_1Second, 120, 10, 30000], // 1s delay, 10 free req, 30s window

  // ========== DIRECTORY ROUTES ==========
  // Read operations - very permissive (users browse directories frequently)
  getDirectory: [_500MS, 60, 20, 30000], // 500ms delay, 20 free req, 30s window

  // Write operations - moderate throttling
  createDirectory: [_1Second, 120, 5, 30000], // 1s delay, 5 free req, 30s window
  renameDirectory: [_1Second, 120, 10, 30000], // 1s delay, 10 free req, 30s window
  deleteDirectory: [_2Second, 180, 5, 30000], // 2s delay, 5 free req, 30s window (destructive)

  // ========== FILE ROUTES ==========
  // File uploads - moderate (resource intensive but batch uploads common)
  uploadFile: [_2Second, 180, 3, 60000], // 2s delay, 3 free req, 60s window

  // File downloads/views - very permissive (users view multiple files)
  getFile: [_500MS, 60, 20, 30000], // 500ms delay, 20 free req, 30s window

  // File modifications - moderate throttling
  renameFile: [_1Second, 120, 10, 30000], // 1s delay, 10 free req, 30s window
  deleteFile: [_2Second, 180, 5, 30000], // 2s delay, 5 free req, 30s window (destructive)
};

export const throttlers = Object.fromEntries(
  Object.entries(throttleConfig).map(
    ([key, [waitTime, ttl, allowedRequest, burstWindow]]) => [
      key,
      createThrottler({ waitTime, ttl, allowedRequest, burstWindow }),
    ]
  )
);

export { _5Second, _3Second, _2Second, _1Second, _500MS };
