import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [
        3,
        "name field should a string with at least three characters",
      ],
    },
    email: {
      type: String,
      required: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
        "please enter an valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minLength: 4,
    },
    rootDirId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Directory"
    }
  },
  {
    strict: "throw",
  }
);

const User = model("User", userSchema);

export default User;
