import { z } from "zod";
import mongoose from "mongoose";

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

export const stringSchema = z.string({
  name: z.string().min(5, "Should contain at least 5 characters").max(100),
});

export const filenameSchema = z
  .string()
  .min(1, "Filename cannot be empty")
  .max(255, "Filename is too long")
  .regex(/^[a-zA-Z0-9._\- ]+$/, "Invalid characters in filename");