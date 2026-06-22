import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authLimiter, deleteAccountLimiter } from "../middleware/rateLimitMiddleware.js";
import { signup, login, upgradeRole, getUserById, changePassword, deleteAccount } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);

router.post("/login", authLimiter, login);

router.put("/upgrade-role", requireAuth, upgradeRole);

router.get("/user/:id", getUserById);

router.put("/change-password", requireAuth, changePassword);

router.delete("/account", requireAuth, deleteAccountLimiter, deleteAccount);

export default router;