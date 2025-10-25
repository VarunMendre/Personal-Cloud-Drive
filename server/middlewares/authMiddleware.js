import Session from "../models/sessionModel.js";
import User from "../models/userModel.js";

export default async function checkAuth(req, res, next) {
  const { sid } = req.signedCookies;

  if (!sid) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "1 Not logged in!" });
  }

  const session = await Session.findById(sid);

  if (!session) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "2 Not logged in!" });
  }

  const user = await User.findOne({ _id: session.userId }).lean();
  if (!user) {
    return res.status(401).json({ error: "3 Not logged in!" });
  }
  req.user = user;
  next();
}

export const checkNotRegularUser = (req, res, next) => {
  if (req.user.role !== "User") return next();
  res.status(403).json({ error: "Users are restricted to access this page" });
};

export const checkIsAdminUser = (req, res, next) => {
  if (req.user.role === "Admin") return next();
  res.status(403).json({ error: "You Cannot Delete User" });
};
