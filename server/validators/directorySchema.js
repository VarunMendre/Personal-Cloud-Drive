import z from "zod";
import { objectIdSchema, stringSchema } from "./commonSchema.js";

export const getDirectorySchema = z.object({
  id: objectIdSchema,
});

export const createDirectorySchema = z.object({
  parentDirId: objectIdSchema,
  dirname: stringSchema,
});

export const renameDirectorySchema = z.object({
  dirId: objectIdSchema,
  newDirName: stringSchema,
});

export const deleteDirectorySchema = z.object({
  dirId: objectIdSchema,
});