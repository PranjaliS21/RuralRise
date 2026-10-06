import fs from "node:fs";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { optionalAuth } from "./auth";
import { HttpError } from "./errors";
import authRouter from "./routes/auth";
import { router as oppRouter, categoriesRouter } from "./routes/opportunities";
import { router as youthRouter } from "./routes/youth";
import { router as employerRouter } from "./routes/employer";
import {
  router as directoryRouter,
  trainingRouter,
  schemesRouter,
  businessRouter,
  marketplaceRouter,
} from "./routes/directory";
import { skillsRouter, notificationsRouter, adminRouter } from "./routes/admin";
import { prisma } from "./db";

const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (
      process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:4173"
    ).split(","),
    credentials: true,
  }),
);
app.use(optionalAuth);

const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: "RuralRise API", database: "connected" });
  } catch {
    res
      .status(503)
      .json({ ok: false, service: "RuralRise API", database: "unreachable" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/opportunities", oppRouter);
app.use("/api/youth", youthRouter);
app.use("/api/employer", employerRouter);
app.use("/api/training", trainingRouter);
app.use("/api/schemes", schemesRouter);
app.use("/api/business", businessRouter);
app.use("/api/marketplace", marketplaceRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/directory", directoryRouter);

// 404 for unknown API routes
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Endpoint not found" }),
);

// Serve the built frontend in production (single-service deploys)
const frontendDist = path.resolve(
  __dirname,
  process.env.FRONTEND_DIST || "../../frontend/dist",
);
if (process.env.SERVE_FRONTEND !== "false" && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Centralized error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("[api] unhandled error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong on our side. Please try again." });
  },
);

export default app;
