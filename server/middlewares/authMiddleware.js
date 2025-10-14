import { mySecretKey } from "../controllers/usersController.js";
import User from "../models/userModel.js";
import crypto, { sign } from "crypto";

export default async function checkAuth(req, res, next) {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ error: "Not logged!" });
  }

  const [payLoad, oldSignature] = token.split(".");

  const jsonPayload = Buffer.from(payLoad, "base64url").toString();

  const newSignature = crypto
    .createHash("SHA-256")
    .update(jsonPayload)
    .update(mySecretKey)
    .digest("base64url");

  if (oldSignature !== newSignature) {
    res.clearCookie("token");
    return res.status(204).json({ error: "Not logged!" });
  }

  const { id, expiry: expiryTimeInSeconds } = JSON.parse(jsonPayload);

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
