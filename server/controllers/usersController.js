import Directory from "../models/directoryModel.js";
import User from "../models/userModel.js";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import Session from "../models/sessionModel.js";

export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  const session = await mongoose.startSession();

  
  // const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const existsUser = await User.findOne({ email });
    if (existsUser) {
      return res.status(400).json({ message: "User Already exists" });
    }

    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    // startTransaction()
    session.startTransaction();

    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { session }
    );

    await User.insertOne(
      {
        _id: userId,
        name,
        email,
        password,
        rootDirId,
      },
      { session }
    );

    // commitTransaction()
    await session.commitTransaction();

    res.status(201).json({ message: "User Registered" });
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 121) {
      res
        .status(400)
        .json({ error: "Invalid input, please enter valid details" });
    } else if (err.code === 11000 && err.keyValue.email) {
      return res.status(409).json({
        error: "User already exists",
        message:
          "A user with this email address already exists. Please try logging in or use a different email.",
      });
    } else {
      next(err);
    }
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "Invalid Credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(404).json({ error: "Invalid Credentials" });
  }

  const MAX_DEVICES = 2;
  const allSessions = await Session.find({ userId: user._id }).sort({createdAt : 1});

  if (allSessions.length >= MAX_DEVICES) {
    const sessionsToDelete = allSessions.length - MAX_DEVICES + 1;
    for (let i = 0; i < sessionsToDelete; i++) {
      await Session.findByIdAndDelete(allSessions[0]._id);
    }
  }

  
  const session = await Session.create({ userId: user._id });


  res.cookie("sid", session.id, {
    httpOnly: true,
    maxAge: 60 * 1000 * 60 * 24 * 7,
    signed: true,
  });
  res.json({ message: "logged in" });
};

export const getCurrentUser = (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
};

export const logout = async (req, res) => {
  const { sid } = req.signedCookies;
  await Session.findByIdAndDelete(sid);
  res.clearCookie("sid");
  res.status(204).end();
};

export const logoutAll = async (req, res, next) => {
  const { sid } = req.signedCookies;
  const session = await Session.findById(sid);

  await Session.deleteMany({ userId: session.userId })
  res.clearCookie('sid');
  res.status(204).end();
};
