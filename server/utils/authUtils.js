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

    if (allSessions.total > 0) {
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
