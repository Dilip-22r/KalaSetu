import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Requires a valid JWT token
export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Optionally decodes a valid token if present, but does not block if missing
export const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

// Requires the user to have artisan or ngo role
export const requireRole = async (req, res, next) => {
  try {
    const dbUser = await User.findById(req.user.id).select("role");
    if (!dbUser || dbUser.role === "user") {
      return res.status(403).json({ message: "Only artisans and NGOs can perform this action" });
    }
    req.user.role = dbUser.role; // keep in sync
    next();
  } catch {
    res.status(500).json({ message: "Server error checking role" });
  }
};
