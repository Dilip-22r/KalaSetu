import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getNotifications, markAllRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", requireAuth, getNotifications);

router.put("/mark-read", requireAuth, markAllRead);

export default router;
