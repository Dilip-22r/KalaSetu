import express from "express";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();



// GET conversations
router.get("/conversations", requireAuth, requireRole, async (req, res) => {
  try {
    const userId = req.user.id;
    // Aggregation pipeline to replace massive Node.js O(N) filtering
    const mongoose = (await import("mongoose")).default;
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);

    const pipeline = [
      {
        $match: {
          $or: [{ sender: userIdObj }, { receiver: userIdObj }],
          deleted: { $ne: true },
          hiddenFor: { $ne: userIdObj }, // exclude messages hidden for this user (cleared chats)
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userIdObj] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // Lookup partner details (User)
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partnerUser"
        }
      },
      { $unwind: "$partnerUser" },
      // Lookup partner profile photo (Profile)
      {
        $lookup: {
          from: "profiles",
          localField: "_id",
          foreignField: "user",
          as: "partnerProfile"
        }
      },
      {
        $project: {
          partner: {
            _id: "$partnerUser._id",
            username: "$partnerUser.username",
            fullName: "$partnerUser.fullName",
            role: "$partnerUser.role",
            email: "$partnerUser.email",
            photo: { $arrayElemAt: ["$partnerProfile.photo", 0] }
          },
          lastMessage: 1
        }
      }
    ];

    const conversations = await Message.aggregate(pipeline);

    // Format final response to handle any missing profile photos safely
    const formatted = conversations.map(c => ({
      partner: { ...c.partner, photo: c.partner.photo || "" },
      lastMessage: c.lastMessage
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET messages between two users (exclude messages hidden for current user)
router.get("/:userId", requireAuth, requireRole, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
      hiddenFor: { $ne: req.user.id },  // exclude "deleted for me" messages
    })
      .populate("sender", "username fullName")
      .populate("replyTo", "text sender")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user.id, status: { $ne: "seen" } },
      { status: "seen" }
    );

    const partnerSocketId = getReceiverSocketId(req.params.userId);
    if (partnerSocketId) io.to(partnerSocketId).emit("message_seen", { partnerId: req.user.id });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND message
router.post("/", requireAuth, requireRole, async (req, res) => {
  try {
    const { receiverId, text, replyTo } = req.body;
    const receiverSocketId = getReceiverSocketId(receiverId);
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const msg = new Message({
      sender: req.user.id,
      receiver: receiverId,
      text,
      status: initialStatus,
      replyTo: replyTo || null,
    });
    await msg.save();
    const populated = await msg.populate([
      { path: "sender", select: "username fullName" },
      { path: "replyTo", select: "text sender" },
    ]);

    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", populated);

    // Create Notification
    const newNotif = new Notification({
      recipient: receiverId,
      sender: req.user.id,
      type: "message",
      message: msg._id,
    });
    await newNotif.save();
    const populatedNotif = await newNotif.populate("sender", "username fullName profilePic");
    
    if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populatedNotif);

    const senderSocketId = getReceiverSocketId(req.user.id);
    if (senderSocketId && initialStatus === "delivered") {
      io.to(senderSocketId).emit("message_delivered", { messageId: populated._id.toString() });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE single message (soft delete for sender only)
router.delete("/:messageId", requireAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user.id) return res.status(403).json({ message: "Not your message" });

    msg.text = "This message was deleted";
    msg.deleted = true;
    await msg.save();

    // Notify receiver in real time
    const receiverSocketId = getReceiverSocketId(msg.receiver.toString());
    if (receiverSocketId) io.to(receiverSocketId).emit("message_deleted", { messageId: msg._id.toString() });

    res.json({ messageId: msg._id, deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CLEAR chat for current user only (WhatsApp-style: only hides for the requester)
router.delete("/clear/:partnerId", requireAuth, requireRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.partnerId;

    // Add current user's ID to hiddenFor on every message in this conversation
    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId },
        ],
        hiddenFor: { $ne: userId }, // skip messages already hidden for this user
      },
      { $push: { hiddenFor: userId } }
    );

    res.json({ message: "Chat cleared for you" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE FOR ME only (hides from one side, using hiddenFor array)
router.delete("/:messageId/for-me", requireAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user.id && msg.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your message" });
    }
    if (!msg.hiddenFor.includes(req.user.id)) {
      msg.hiddenFor.push(req.user.id);
      await msg.save();
    }
    res.json({ messageId: msg._id, hiddenForMe: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;