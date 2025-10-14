import User from "../models/userModel.js";
import crypto, { sign } from "crypto";

export default async function checkAuth(req, res, next) {
  const { token } = req.signedCookies;

  if (!token) {
    res.clearCookie("token");
    return res.status(401).json({ error: "Not logged!" });
  }

  const { id, expiry: expiryTimeInSeconds } = JSON.parse(
    Buffer.from(token, "base64url").toString()
  );

  const currentTimeInSeconds = Math.round(Date.now() / 1000);

  if (currentTimeInSeconds > expiryTimeInSeconds) {
    res.clearCookie("token");
    return res.status(204).json({ error: "Not logged!" });
  }

  const user = await User.findOne({ _id: id }).lean();
  if (!user) {
    return res.status(401).json({ error: "Not logged!" });
  }
  req.user = user;
  next();
}
