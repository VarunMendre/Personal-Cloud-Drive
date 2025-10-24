import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

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
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
        "please enter a valid email",
      ],
    },
    password: {
      type: String,
      minLength: 4,
    },
    picture: {
      type: String,
      default:
        "https://imgs.search.brave.com/GprHr6xGe1tKX2sErMSZsWRf6Cvke9lgI9Axf2ZoJKQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC80/Mi8wOC9hdmF0YXIt/ZGVmYXVsdC11c2Vy/LXByb2ZpbGUtaWNv/bi1zb2NpYWwtbWVk/aWEtdmVjdG9yLTU3/MjM0MjA4LmpwZw",
    },
    rootDirId: {
      type: Schema.Types.ObjectId,
      ref: "Directory",
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "User"],
      default: "User"
    }
  },
  {
    strict: "throw",
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model("User", userSchema);

export default User;
