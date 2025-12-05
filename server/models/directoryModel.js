import { model, Schema } from "mongoose";

const directorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      default: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    parentDirId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Directory",
    },
    path: {
      type: [Schema.Types.ObjectId],
      ref: "Directory",
      required: true,
    },
    sharedWith: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["viewer", "editor"],
          default: "viewer",
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

directorySchema.methods.hasAccess = function (userId, requiredRole = "viewer") {
  if (this.userId.toString() === userId.toString()) return true;

  const share = this.sharedWith.find(
    (s) => s.userId.toString() === userId.toString()
  );

  if (!share) return false;

  if (requiredRole === "viewer") return true;

  if (requiredRole === "editor") {
    return share.role === "editor";
  }

  return false;
};

directorySchema.methods.getUserRole = function (userId) {
  if (this.userId.toString() == userId.toString()) return "owner";

  const share = this.sharedWith.find(
    (s) => s.userId.toString() === userId.toString()
  );

  return share ? share.role : null;
};

export default model("Directory", directorySchema);
