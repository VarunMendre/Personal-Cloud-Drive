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
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

export default model("Directory", directorySchema);
