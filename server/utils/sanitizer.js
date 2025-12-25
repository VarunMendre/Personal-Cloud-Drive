import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

let DOMPurify;

const getDOMPurify = () => {
  if (!DOMPurify) {
    const window = new JSDOM("").window;
    DOMPurify = createDOMPurify(window);
  }
  return DOMPurify;
};

/**
 * Sanitizes a string or an object using DOMPurify
 * @param {string|object} input - Content to sanitize
 * @returns {string|object} - Sanitized content
 */
export const sanitize = (input) => {
  const dp = getDOMPurify();
  
  if (typeof input === "string") {
    return dp.sanitize(input);
  }

  if (input && typeof input === "object" && !Array.isArray(input)) {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = typeof value === "string" ? dp.sanitize(value) : value;
    }
    return sanitizedObj;
  }

  return input;
};

export default sanitize;
