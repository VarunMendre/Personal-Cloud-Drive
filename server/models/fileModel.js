// models/File.js
import { model, Schema } from "mongoose";

const fileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    parentDirId: {
      type: Schema.Types.ObjectId,
      ref: "Directory",
    },

    // NEW: Sharing configuration
    sharedWith: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          role: { type: String, enum: ["viewer", "editor"], default: "viewer" },
          sharedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    shareLink: {
      type: {
        enabled: { type: Boolean, default: false },
        token: { type: String, unique: true, sparse: true },
        role: { type: String, enum: ["viewer", "editor"], default: "viewer" },
        createdAt: { type: Date },
      },
      _id: false,
      default: () => ({
        enabled: false,
        role: "viewer",
        createdAt: null,
      }),
    },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

// to check if user has access
fileSchema.methods.hasAccess = function (userId, requiredRole = "viewer") {
  if (this.userId.toString() === userId.toString()) {
    return true;
  }

  const share = this.sharedWith.find(
    (s) => s.userId.toString() === userId.toString()
  );
  if (!share) return false;

  if (requiredRole === "viewer") {
    return true;
  }
  if (requiredRole === "editor") {
    return share.role === "editor";
  }

  return false;
};

//  to get user's role
fileSchema.methods.getUserRole = function (userId) {
  if (this.userId.toString() === userId.toString()) {
    return "owner";
  }

  const share = this.sharedWith.find(
    (s) => s.userId.toString() === userId.toString()
  );
  return share ? share.role : null;
};

export default model("File", fileSchema);
