import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { generalApiLimiter } from "./middleware/rateLimitMiddleware.js";
import errorHandler from "./middleware/errorHandler.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

// trust proxy is REQUIRED for rate limiters behind Render/Heroku load balancers
app.set("trust proxy", 1);

// ─── 0. Gzip compression (must be before routes — compresses all responses) ────
app.use(compression({ threshold: 1024 })); // compress responses > 1KB

// ─── 1. Security headers (must be first) ─────────────────────────────────────
app.use(helmet());

// ─── 2. CORS (allow frontend origins dynamically) ─────────────────────────
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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
  credentials: true 
}));

// ─── 3. Body parsing (12MB limit — safe for base64 images up to 5MB) ─────────
app.use(express.json({ limit: "12mb" }));

// ─── 4. NoSQL injection protection (strip MongoDB operators from inputs) ──────
app.use(mongoSanitize());

// ─── 5. XSS sanitization (strip HTML tags from string inputs in body) ────────
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
      for (const key of Object.keys(obj)) {
        // Skip fields that should not be sanitized (files, base64 data, and raw passwords)
        const skipFields = ["photo", "image", "verificationDocument", "password", "oldPassword", "newPassword", "confirmPassword", "currentPassword"];
        if (skipFields.includes(key)) {
          clean[key] = obj[key];
        } else {
          clean[key] = sanitizeValue(obj[key]);
        }
      }
      return clean;
    };
    req.body = sanitizeObject(req.body);
  }
  next();
});

// ─── 6. Global rate limiter (all routes) ─────────────────────────────────────
app.use(generalApiLimiter);

// ─── 7. Routes ────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);
app.use("/profiles", profileRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reports", reportRoutes);

// ─── 8. Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KalaSetu server running on port ${PORT}`);
});