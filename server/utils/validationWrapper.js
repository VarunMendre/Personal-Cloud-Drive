import z from "zod";

/**
 * Validates data against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {object} data - Data to validate
 * @returns {object} - { success, data, fieldErrors, error }
 */
export const validateWithSchema = (schema, data) => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const flattened = z.flattenError(result.error);
    return {
      success: false,
      fieldErrors: flattened.fieldErrors,
      error: "Validation failed",
    };
  }

  return {
    success: true,
    data: result.data,
  };
};
