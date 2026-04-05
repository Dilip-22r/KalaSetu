import rateLimit from "express-rate-limit";

// ─── Shared on-limit logger ───────────────────────────────────────────────────
function onLimitReached(req, _res, _options) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || "unknown";
  console.warn(`[RATE LIMIT] ${timestamp} | IP: ${ip} | ${req.method} ${req.originalUrl}`);
}

// ─── Auth Limiter ─────────────────────────────────────────────────────────────
// Applied to /auth/login and /auth/signup
// Key: IP + email (lowercased) — prevents IP-rotation attacks targeting one account
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },   // suppress IPv6 key-gen warning; we handle IPs manually
  keyGenerator: (req) => {
    const ip = req.ip || "unknown";
    const email = (req.body?.email || "").toLowerCase().trim();
    return `${ip}-${email}`;
  },
  handler: (req, res, _next, _options) => {
    onLimitReached(req, res, _options);
    res.status(429).json({ message: "Too many attempts. Please wait 15 minutes before trying again." });
  },
});

// ─── General API Limiter ──────────────────────────────────────────────────────
// Applied globally to all routes — prevents bots and scrapers
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  handler: (req, res, _next, _options) => {
    onLimitReached(req, res, _options);
    res.status(429).json({ message: "Too many requests. Please slow down." });
  },
});

// ─── Upload Limiter ───────────────────────────────────────────────────────────
// Applied only to image/file upload endpoints — prevents base64 spam / memory abuse
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  handler: (req, res, _next, _options) => {
    onLimitReached(req, res, _options);
    res.status(429).json({ message: "Upload rate limit exceeded. Please try again in a minute." });
  },
});

// ─── Delete Account Limiter ───────────────────────────────────────────────────
// Applied to DELETE /auth/account — prevents automated account deletion abuse
export const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  handler: (req, res, _next, _options) => {
    onLimitReached(req, res, _options);
    res.status(429).json({ message: "Too many attempts. Please try again later." });
  },
});
