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
    sharedWith: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["viewer", "editor"],
        default: "viewer"
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    shareLink: {
      token: {
        type: String,
        unique: true,
        sparse: true
      },
      url: String,
      role: {
        type: String,
        enum: ["viewer", "editor"],
        default: "viewer"
      },
      enabled: {
        type: Boolean,
        default: false
      },
      createdAt: Date
    }
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

export default model("Directory", directorySchema);
