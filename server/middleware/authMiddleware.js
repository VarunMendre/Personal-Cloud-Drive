import { ObjectId } from "mongodb";

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies;
  const db = req.db;
  if (!uid) {
    return res.status(401).json({ message: "Unauthorized Access" });
  }
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(String(uid)) });

  if (!user) {
    return res.status(401).json({ message: "Unauthorized Access" });
  }
  req.user = user;
  next();
}
