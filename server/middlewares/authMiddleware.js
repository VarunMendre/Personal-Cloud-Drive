import redisClient from "../config/redis.js";

export default async function checkAuth(req, res, next) {
  const { sid } = req.signedCookies;

  if (!sid) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "1 Not logged in!" });
  }

  const session = await redisClient.json.get(`session:${sid}`);

  if (!session) {
    res.clearCookie("sid");
    return res.status(401).json({ error: "2 Not logged in!" });
  }
  
  req.user = { _id: session.userId, rootDirId: session.rootDirId };
  next();
}

export const checkNotRegularUser = (req, res, next) => {
  if (req.user.role !== "User") return next();
  res.status(403).json({ error: "Users are restricted to access this page" });
};

export const checkIsOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === "Owner" || req.user.role === "Admin") {
    return next();
  }
  res.status(403).json({ error: "You Cannot Delete User" });
};

export const checkUserDeleted = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (req.user.isDeleted) {
    return res.status(403).json({
      error: "Your account has been deleted. Contact Apps admin to recovery",
    });
  }
  next();
};

export const checkIsOwner = (req, res, next) => {
  if (req.user && req.user.role === "Owner") return next();
  return res.status(403).json({ error: "Access denied. Owner role required." });
};
