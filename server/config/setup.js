import mongoose from "mongoose";
import { connectDB } from "./db.js";

await connectDB();
const client = mongoose.connection.getClient();

try {
  const db = mongoose.connection.db;

  // Update directories validator
  await db.command({
    collMod: "directories",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "userId", "parentDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          size: {
            bsonType: "int",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: ["objectId", "null"],
          },
          path: {
            bsonType: "array",
            items: {
              bsonType: "objectId",
            },
          },
          createdAt: {
            bsonType: ["date", "null"],
          },
          updatedAt: {
            bsonType: ["date", "null"],
          },
          __v: {
            bsonType: ["int", "null"],
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: "error",
    validationLevel: "strict",
  });

  // Update files validator (same changes)
  await db.command({
    collMod: "files",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "extension", "userId", "parentDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
          },
          size: {
            bsonType: "int",
          },
          extension: {
            bsonType: "string",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: "objectId",
          },
          createdAt: {
            bsonType: ["date", "null"],
          },
          updatedAt: {
            bsonType: ["date", "null"],
          },
          __v: {
            bsonType: ["int", "null"],
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: "error",
    validationLevel: "strict",
  });

  await db.command({
    collMod: "users",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "email", "rootDirId"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          name: {
            bsonType: "string",
            minLength: 3,
            description:
              "name field should a string with at least three characters",
          },
          email: {
            bsonType: "string",
            description: "please enter a valid email",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
          },
          password: {
            bsonType: "string",
          },
          picture: {
            bsonType: "string",
          },
          rootDirId: {
            bsonType: "objectId",
          },
          maxStorageLimit: {
            bsonType: "long",
          },
          role: {
            bsonType: "string",
            enum: ["Owner", "Admin", "Manager", "User"],
          },
          isDeleted: {
            bsonType: "bool",
          },
          __v: {
            bsonType: "int",
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: "error",
    validationLevel: "strict",
  });
} catch (err) {
  console.error("❌ Error", err);
} finally {
  await client.close();
}
