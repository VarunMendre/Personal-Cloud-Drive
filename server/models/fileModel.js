// models/File.js
import { model, Schema } from "mongoose";
import { number } from "zod";

const fileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
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
    isUploading: {
      type: Boolean,
      default: false,
      required: true,
    },
    sharedWith: [{
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["viewer", "editor"],
        default: "viewer",
        required: true,
      },
      sharedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    shareLink: {
      token: {
        type: String,
        unique: true,
        sparse: true,
      },
      url: String,
      role: {
        type: String,
        enum: ["viewer", "editor"],
        default: "viewer",
      },
      enabled: {
        type: Boolean,
        default: false,
      },
      createdAt: Date,
    }
  },
  {
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
