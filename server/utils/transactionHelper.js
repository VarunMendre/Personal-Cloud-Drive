import mongoose from "mongoose";

/**
 * Executes a callback within a Mongoose transaction
 * @param {Function} callback - Async function that takes the session as an argument
 * @returns {Promise<any>} - The result of the callback
 */
export const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
