import crypto from "crypto";
import redisClient from "../config/redis.js";

/**
 * Deletes all active sessions for a given user from Redis
 * @param {string} userId - ID of the user whose sessions should be deleted
 * @returns {Promise<number>} - Number of sessions deleted
 */
export const deleteUserSessions = async (userId) => {
  try {
    const allSessions = await redisClient.ft.search(
      "userIdInx",
      `@userId:{${userId}}`,
      {
        RETURN: [],
      }
    );

    if (allSessions?.total > 0) {
      await Promise.all(
        allSessions.documents.map((doc) => redisClient.del(doc.id))
      );
    }

    return allSessions.total;
  } catch (err) {
    console.error(`Error deleting sessions for user ${userId}:`, err);
    throw new Error("Failed to clear user sessions");
  }
};
/**
 * Creates a new session for a user, managing device limits and cookies
 * @param {object} res - Express response object
 * @param {object} user - User document/object { _id, rootDirId, role, maxDevices }
 * @returns {Promise<string>} - The new session ID
 */
export const createSession = async (res, user) => {
  const userId = user._id.toString();
  const maxDevicesLimit = user.maxDevices || 1;

  // 1. Manage device limits
  try {
    const allSessions = await redisClient.ft.search(
      "userIdInx",
      `@userId:{${userId}}`,
      { RETURN: [] }
    );

    if (allSessions.total >= maxDevicesLimit) {
      // Delete the oldest session
      await redisClient.del(allSessions.documents[0].id);
    }
  } catch (err) {
    console.error("Redis search for device limits failed. Skipping limit enforcement:", err.message);
    // Continue session creation even if search fails (e.g. index missing)
  }

  // 2. Create session in Redis using RedisJSON
  const sessionId = crypto.randomUUID();
  const redisKey = `session:${sessionId}`;

  await redisClient.json.set(redisKey, "$", {
    userId: user._id.toString(),
    rootDirId: user.rootDirId.toString(),
    role: user.role,
  });

  // Set 7-day expiration
  await redisClient.expire(redisKey, 60 * 60 * 24 * 7);

  // 3. Set cookie
  res.cookie("sid", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Must be true for SameSite: None
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return sessionId;
};
