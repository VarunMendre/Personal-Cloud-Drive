import express from "express";
import checkAuth from "../middlewares/authMiddleware.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const { name, email, password } = req.body;
  const db = req.db;
  const foundUser = await db.collection("users").findOne({ email });
  if (foundUser) {
    return res.status(409).json({
      error: "User already exists",
      message:
        "A user with this email address already exists. Please try logging in or use a different email.",
    });
  }
  try {
    const rootDirId = new ObjectId();
    const userId = new ObjectId();
    const dirCollection = db.collection("directories");
    
    // startTransaction()

    await dirCollection.insertOne({
      _id: rootDirId,
      name: `root-${email}`,
      parentDirId: null,
      userId,
    });

    await db.collection("users").insertOne({
      _id: userId,
      name,
      email,
      password,
      rootDirId,
    });

    // commitTransaction()

    res.status(201).json({ message: "User Registered" });
  } catch (err) {
    if (err.code === 121) {
      res
        .status(400)
        .json({ error: "Invalid input, please enter valid details" });
    } else {
      next(err);
    }
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const db = req.db;
  const user = await db.collection("users").findOne({ email, password });
  if (!user) {
    return res.status(404).json({ error: "Invalid Credentials" });
  }
  res.cookie("uid", user._id.toString(), {
    httpOnly: true,
    maxAge: 60 * 1000 * 60 * 24 * 7,
  });
  res.json({ message: "logged in" });
});

router.get("/", checkAuth, (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("uid");
  res.status(204).end();
});

export default router;
