import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import checkAuth from "./middlewares/authMiddleware.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { connectDB } from "./config/db.js";

const mySecretKey = process.env.MY_SECRET_KEY;

await connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cookieParser(process.env.MY_SECRET_KEY));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "frame-ancestors": ["'self'", process.env.CLIENT_ORIGIN],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.use("/directory", checkAuth, directoryRoutes);
app.use("/file", checkAuth, fileRoutes);
app.use("/", userRoutes);
app.use("/auth", authRoutes);
app.use("/import", checkAuth, importRoutes);
app.use("/share", checkAuth, shareRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  // res.status(err.status || 500).json({ error: "Something went wrong!" });
  res.json(err);
});

app.listen(PORT, () => {
  console.log(`Server Started`);
});
