import express from "express";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const requireAuth = (req, res, next) => {
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

const requireRole = async (req, res, next) => {
  try {
    const dbUser = await User.findById(req.user.id).select("role");
    if (!dbUser || dbUser.role === "user") {
      return res.status(403).json({ message: "Only artisans and NGOs can message" });
    }
    req.user.role = dbUser.role;
    next();
  } catch {
    res.status(500).json({ message: "Server error checking role" });
  }
};

// GET all conversations for a user (list of unique people they've messaged)
router.get("/conversations", requireAuth, requireRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username fullName role")
      .populate("receiver", "username fullName role")
      .sort({ createdAt: -1 });

    // Build unique conversation partners
    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      if (!seen.has(partner._id.toString())) {
        seen.add(partner._id.toString());
        conversations.push({ partner, lastMessage: msg });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET messages between two users
router.get("/:userId", requireAuth, requireRole, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    })
      .populate("sender", "username fullName")
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND message
router.post("/", requireAuth, requireRole, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const msg = new Message({
      sender: req.user.id,
      receiver: receiverId,
      text,
    });
    await msg.save();
    const populated = await msg.populate("sender", "username fullName");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;