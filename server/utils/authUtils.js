import crypto from "crypto";
import redisClient from "../config/redis.js";

/**
 * Initializes the Redis Search index for session management
 */
export const initializeRedisindex = async () => {
  try {
    const allIndexes = await redisClient.ft._list();

    // If index already exists, we might need to drop it to update schema
    if (allIndexes.includes("userIdInx")) {
      await redisClient.ft.dropIndex("userIdInx");
      console.log("Old Redis Search Index 'userIdInx' dropped for schema update");
    }

    await redisClient.ft.create("userIdInx", {
      "$.userId": { type: 'TAG', AS: "userId" },
      "$.createdAt": { type: 'NUMERIC', AS: "createdAt", SORTABLE: true },
    }, { ON: "JSON", PREFIX: "session:" });

    console.log("✅ Redis Search Index 'userIdInx' created with createdAt field");
  } catch (error) {
    if (!error.message.includes("Index already exists")) {
      console.error("Failed to initialize index:", error);
    }
  }
}


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
    let allSessions;
    try {
      // Try sorted search first
      allSessions = await redisClient.ft.search(
        "userIdInx",
        `@userId:{${userId}}`,
        {
          SORTBY: { BY: "createdAt", DIRECTION: "ASC" },
          RETURN: ["$.createdAt"]
        }
      );
    } catch (searchErr) {
      console.warn("Sorted Redis search failed, falling back to unsorted search:", searchErr.message);
      // Fallback: regular search and we'll sort in memory if needed
      allSessions = await redisClient.ft.search(
        "userIdInx",
        `@userId:{${userId}}`,
        { RETURN: ["$.createdAt"] }
      );
      
      // Sort in JS if there are multiple documents
      if (allSessions.documents.length > 1) {
        allSessions.documents.sort((a, b) => {
          const aTime = a.value["$.createdAt"] || 0;
          const bTime = b.value["$.createdAt"] || 0;
          return aTime - bTime;
        });
      }
    }

    if (allSessions.total >= maxDevicesLimit) {
      // Delete the oldest session(s) until we are below the limit
      const sessionsToDeleteCount = (allSessions.total - maxDevicesLimit) + 1;
      
      for (let i = 0; i < sessionsToDeleteCount; i++) {
        if (allSessions.documents[i]) {
          const oldestSessionId = allSessions.documents[i].id;
          await redisClient.del(oldestSessionId);
          
          const sid = oldestSessionId.replace("session:", "");
          await redisClient.set(`eviction:${sid}`, "true", { EX: 600 });
          console.log(`[DeviceLimit] Evicted session: ${sid} for user: ${userId}`);
        }
      }
    }
  } catch (err) {
    console.error("Device limit enforcement failed critical error:", err.message);
  }

  // 2. Create session in Redis using RedisJSON
  const sessionId = crypto.randomUUID();
  const redisKey = `session:${sessionId}`;

  await redisClient.json.set(redisKey, "$", {
    userId: user._id.toString(),
    rootDirId: user.rootDirId.toString(),
    role: user.role,
    createdAt: Date.now(),
  });

  // Set 7-day expiration
  await redisClient.expire(redisKey, 60 * 60 * 24 * 7);

  // 3. Set cookie
  res.cookie("sid", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return sessionId;
};
