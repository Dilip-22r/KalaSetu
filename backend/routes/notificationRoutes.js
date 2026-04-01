import express from "express";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET notifications with pagination
router.get("/", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username fullName profilePic")
      .populate("post", "title image");

    const total = await Notification.countDocuments({ recipient: req.user.id });
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });

    res.json({
      notifications,
      total,
      unreadCount,
      hasMore: page * limit < total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MARK ALL AS READ
router.put("/mark-read", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
