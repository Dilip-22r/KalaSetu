import express from "express";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { getReceiverSocketId, io } from "../lib/socket.js";

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

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
    const { Profile } = await import("../models/Profile.js");
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username fullName role")
      .populate("receiver", "username fullName role")
      .sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];
    for (const msg of messages) {
      const partner = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      if (!seen.has(partner._id.toString())) {
        seen.add(partner._id.toString());
        const partnerProfile = await Profile.findOne({ user: partner._id }).select("photo");
        const partnerWithPhoto = { ...partner.toObject(), photo: partnerProfile?.photo || "" };
        conversations.push({ partner: partnerWithPhoto, lastMessage: msg });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET messages between two users — also marks them as delivered then seen
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

    // Upgrade all messages sent TO the current user that weren't seen yet → "seen"
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, status: { $ne: "seen" } },
      { status: "seen" }
    );

    // Notify the partner that their messages have been seen
    const partnerSocketId = getReceiverSocketId(req.params.userId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("message_seen", { partnerId: req.user.id });
    }

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND message
router.post("/", requireAuth, requireRole, async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    // Check if receiver is online — start at "delivered", else "sent"
    const receiverSocketId = getReceiverSocketId(receiverId);
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const msg = new Message({
      sender: req.user.id,
      receiver: receiverId,
      text,
      status: initialStatus,
    });
    await msg.save();
    const populated = await msg.populate("sender", "username fullName");

    // Push message to receiver in real time
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populated);
    }

    // Tell the SENDER whether it was delivered (so their tick can update)
    const senderSocketId = getReceiverSocketId(req.user.id);
    if (senderSocketId && initialStatus === "delivered") {
      io.to(senderSocketId).emit("message_delivered", { messageId: populated._id.toString() });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;