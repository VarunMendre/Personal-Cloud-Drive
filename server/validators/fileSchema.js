import z from "zod";
import { filenameSchema, objectIdSchema, stringSchema } from "./commonSchema.js";

export const getFileSchema = z.object({
  fileId: stringSchema,
});

export const renameFileSchema = z.object({
  fileId: objectIdSchema,
  newFilename: filenameSchema,
  userId: objectIdSchema,
  version: z.number().optional(),
});


export const deleteFileSchema = z.object({
    fileId: objectIdSchema,
    userId: objectIdSchema,
});