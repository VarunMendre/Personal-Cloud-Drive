import { z } from "zod";
import mongoose from "mongoose";

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  });

export const stringSchema = z.object({
  name: z.string().min(5, "Should contain at least 5 characters").max(100),
});
