import { CustomError } from "./CustomError.js";

/**
 * Parses errors from Razorpay or other external services
 * and returns a standardized CustomError.
 * 
 * @param {Error} error - The original error object
 * @param {string} defaultMessage - Fallback message if no specific error found
 * @returns {CustomError}
 */
export const handleRazorpayError = (error, defaultMessage = "Something went wrong") => {
  // If it's already a CustomError, just re-throw or return it
  if (error instanceof CustomError) {
    return error;
  }

  // 1. Razorpay Specific Logic
  if (error.error && error.error.description) {
      if (error.error.code === "BAD_REQUEST_ERROR") {
          return new CustomError(`Payment Error: ${error.error.description}`, 400, {
              code: error.error.code,
              details: error.error
          });
      }
      return new CustomError(`Gateway Error: ${error.error.description}`, 400, {
          code: error.error.code
      });
  }

  // 2. Network / Connectivity Errors
  if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return new CustomError("Network Error: Unable to reach payment gateway. Please check your connection.", 502, {
          code: error.code
      });
  }

  // 3. Fallback for other errors (keep status if present)
  return new CustomError(
      error.message || defaultMessage,
      error.status || error.statusCode || 500
  );
};
