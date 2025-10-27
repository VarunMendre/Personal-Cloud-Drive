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
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: ["objectId", "null"],
          },

          // ✅ sharedWith KEEPS _id (useful for array operations)
          sharedWith: {
            bsonType: ["array"],
            items: {
              bsonType: "object",
              required: ["userId", "role"],
              properties: {
                userId: {
                  bsonType: "objectId",
                },
                role: {
                  bsonType: "string",
                  enum: ["viewer", "editor"],
                },
                sharedAt: {
                  bsonType: ["date", "null"],
                },
                _id: {
                  // ✅ Keep this
                  bsonType: "objectId",
                },
              },
              additionalProperties: false,
            },
          },

          // ❌ shareLink NO LONGER has _id
          shareLink: {
            bsonType: ["object"],
            properties: {
              enabled: {
                bsonType: ["bool", "null"],
              },
              token: {
                bsonType: ["string", "null"],
              },
              role: {
                bsonType: ["string", "null"],
                enum: ["viewer", "editor", null],
              },
              createdAt: {
                bsonType: ["date", "null"],
              },
              // ❌ REMOVED: _id field
            },
            additionalProperties: false,
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
          extension: {
            bsonType: "string",
          },
          userId: {
            bsonType: "objectId",
          },
          parentDirId: {
            bsonType: "objectId",
          },

          sharedWith: {
            bsonType: ["array"],
            items: {
              bsonType: "object",
              required: ["userId", "role"],
              properties: {
                userId: {
                  bsonType: "objectId",
                },
                role: {
                  bsonType: "string",
                  enum: ["viewer", "editor"],
                },
                sharedAt: {
                  bsonType: ["date", "null"],
                },
                _id: {
                  bsonType: "objectId",
                },
              },
              additionalProperties: false,
            },
          },

          shareLink: {
            bsonType: ["object"],
            properties: {
              enabled: {
                bsonType: ["bool", "null"],
              },
              token: {
                bsonType: ["string", "null"],
              },
              role: {
                bsonType: ["string", "null"],
                enum: ["viewer", "editor", null],
              },
              createdAt: {
                bsonType: ["date", "null"],
              },
            },
            additionalProperties: false,
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

  console.log("✅ Validators updated - shareLink._id removed!");
} catch (err) {
  console.error("❌ Error updating validators:", err);
} finally {
  await client.close();
}
