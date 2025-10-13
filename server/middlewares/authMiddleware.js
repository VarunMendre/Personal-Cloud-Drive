import User from "../models/userModel.js";

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies;
  if (!uid) {
    return res.status(401).json({ error: "Not logged!" });
  }
  const { id, expiry: expiryTimeInSeconds } = JSON.parse(
    Buffer.from(uid, "base64url").toString()
  );

  const currentTimeInSeconds = Math.round(Date.now() / 1000);

  if (currentTimeInSeconds > expiryTimeInSeconds) {
    res.clearCookie("uid");
    return res.status(204).json({ error: "Not logged!" });
  }

  const user = await User.findOne({ _id: id }).lean();
  if (!user) {
    return res.status(401).json({ error: "Not logged!" });
  }
  req.user = user;
  next();
}
