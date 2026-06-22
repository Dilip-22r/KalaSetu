import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import cookieParser from "cookie-parser";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";


import { generalApiLimiter } from "./middleware/rateLimitMiddleware.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// trust proxy is REQUIRED for rate limiters behind Render/Heroku load balancers
app.set("trust proxy", 1);

// ─── 0. Gzip compression (must be before routes) ─────────────────────────────
app.use(compression({ threshold: 1024 }));

// ─── 1. Security headers ──────────────────────────────────────────────────────
// Disable CSP for /api-docs so Swagger UI (inline scripts + CDN assets) can load
app.use("/api-docs", (req, res, next) => helmet({ contentSecurityPolicy: false })(req, res, next));
app.use(helmet());

// ─── 2. CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith("http://localhost:") ||
      origin.endsWith(".vercel.app") ||
      origin === process.env.ALLOWED_ORIGIN
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ─── 3. Body parsing (12MB limit — safe for base64 images up to 5MB) ─────────
app.use(express.json({ limit: "12mb" }));

// ─── 4. Cookie parser (required for guest cart session & guestId cookie) ──────
app.use(cookieParser());

// ─── 5. Session (required for subscription plans view tracking demo) ──────────
app.use(session({
  secret: process.env.SESSION_SECRET || "kalasetu_session_secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));

// ─── 6. NoSQL injection protection ───────────────────────────────────────────
app.use(mongoSanitize());

// ─── 7. XSS sanitization ─────────────────────────────────────────────────────
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    const sanitizeValue = (val) => {
      if (typeof val === "string") return xss(val);
      if (Array.isArray(val)) return val.map(sanitizeValue);
      if (val !== null && typeof val === "object") return sanitizeObject(val);
      return val;
    };
    const sanitizeObject = (obj) => {
      const clean = {};
      const skipFields = ["photo", "image", "verificationDocument", "password", "oldPassword", "newPassword", "confirmPassword", "currentPassword"];
      for (const key of Object.keys(obj)) {
        clean[key] = skipFields.includes(key) ? obj[key] : sanitizeValue(obj[key]);
      }
      return clean;
    };
    req.body = sanitizeObject(req.body);
  }
  next();
});

// ─── 8. Global rate limiter ───────────────────────────────────────────────────
app.use(generalApiLimiter);

// ─── 9. Routes ────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);
app.use("/profiles", profileRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reports", reportRoutes);


// ─── 10. Swagger API Docs ─────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "KalaSetu API Docs",
  swaggerOptions: { persistAuthorization: true },
}));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── 11. Global error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

export default app;
