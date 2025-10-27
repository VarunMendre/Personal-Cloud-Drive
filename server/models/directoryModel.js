import { model, Schema } from "mongoose";

const directorySchema = new Schema(
  {
    name: {
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
      default: null,
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

//  to check if user has access
directorySchema.methods.hasAccess = function (userId, requiredRole = "viewer") {
  // Owner has full access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }

  //  if user is in sharedWith
  const share = this.sharedWith.find(
    (s) => s.userId.toString() === userId.toString()
  );
  if (!share) return false;

  if (requiredRole === "viewer") {
    return true; // viewer or editor can view
  }
  if (requiredRole === "editor") {
    return share.role === "editor";
  }

  return false;
};

// to get user's role
directorySchema.methods.getUserRole = function (userId) {
  if (this.userId.toString() === userId.toString()) {
    return "owner";
  }

  const share = this.sharedWith.find(
    (s) => s.userId.toString() === userId.toString()
  );
  return share ? share.role : null;
};

export default model("Directory", directorySchema);
