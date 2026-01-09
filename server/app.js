import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import checkAuth from "./middlewares/authMiddleware.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { startCronJobs } from "./cron-jobs/index.js";
import { initializeRedisindex } from "./utils/authUtils.js";

const mySecretKey = process.env.MY_SECRET_KEY;

connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.set("trust proxy", 1);

if (!process.env.MY_SECRET_KEY) {
  console.error("CRITICAL: MY_SECRET_KEY is not defined in environment variables!");
}

app.use(cookieParser(process.env.MY_SECRET_KEY || "fallback_secret_for_local_only"));
app.use(express.json());
const clientOrigin = process.env.CLIENT_ORIGIN?.replace(/\/$/, "");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "frame-ancestors": ["'self'", clientOrigin],
      },
    },
  })
);

app.use(
  cors({
    origin: clientOrigin,
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
app.use("/share", shareRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/subscriptions", checkAuth, subscriptionRoutes);

// Testing rotes for AWS EC2
app.get("/", (req, res) => {
	res.json({message: "Mono Repo Backend is Live from AWS"});
})

// Checking how pm2 not restarts the with npm command

app.get("/err", (req, res) => {
  console.log("Process exited with error");
  process.exit(1);
});


app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  res.status(status).json({ status, message });
});

app.listen(PORT, async() => {
  await initializeRedisindex();
  startCronJobs();
  console.log(`Server Started on port ${PORT}`);
});
