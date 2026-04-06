import express from "express";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { Block } from "../models/Block.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { Notification } from "../models/Notification.js";
import { uploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateImage } from "../middleware/imageValidationMiddleware.js";

const router = express.Router();

// ─── Helper: can A send a message to B? ──────────────────────────────────────
async function canSendMessage(senderId, receiverId) {
  if (String(senderId) === String(receiverId)) {
    return { allowed: false, reason: "self" };
  }

  // Optimize: Fetch Block status, Profile privacy, and User follower data concurrently!
  const [block, receiverProfile, receiver] = await Promise.all([
    Block.findOne({
      $or: [
        { blocker: senderId, blocked: receiverId },
        { blocker: receiverId, blocked: senderId },
      ],
    }).lean(),
    Profile.findOne({ user: receiverId }).lean(),
    User.findById(receiverId).select("followers followRequests").lean()
  ]);

  const isBlocked = !!block;
  const iBlockedThem = block ? String(block.blocker) === String(senderId) : false;

  // Block check comes FIRST
  if (isBlocked) {
    return { allowed: false, reason: iBlockedThem ? "you_blocked" : "unavailable" };
  }

  // Public account — anyone can message
  if (!receiverProfile || !receiverProfile.isPrivate) {
    return { allowed: true };
  }

  // Private account — sender must be an approved follower
  if (!receiver) return { allowed: false, reason: "not_found" };

  const isFollower = receiver.followers.some(
    (f) => f.toString() === String(senderId)
  );
  if (isFollower) return { allowed: true };

  const isPending = receiver.followRequests.some(
    (r) => r.toString() === String(senderId)
  );
  return {
    allowed: false,
    reason: isPending ? "pending_request" : "not_following",
  };
}

// ─── GET conversations (exclude conversations with blocked users) ──────────────
router.get("/conversations", requireAuth, requireRole, async (req, res, next) => {
  try {
    const mongoose = (await import("mongoose")).default;
    const userId = req.user.id;
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);

    // Get all user IDs involved in a block with this user (either direction)
    const blockRecords = await Block.find({
      $or: [{ blocker: userId }, { blocked: userId }],
    })
      .select("blocker blocked")
      .lean();

    const blockedUserIds = blockRecords.map((b) =>
      String(b.blocker) === String(userId) ? b.blocked : b.blocker
    );

    const unreadPipeline = [
      {
        $match: {
          receiver: userIdObj,
          status: { $ne: "seen" },
          deleted: { $ne: true },
          hiddenFor: { $ne: userIdObj },
        },
      },
      { $group: { _id: "$sender", unreadCount: { $sum: 1 } } },
    ];
    const unreadRaw = await Message.aggregate(unreadPipeline);
    const unreadMap = {};
    for (const row of unreadRaw) {
      unreadMap[row._id.toString()] = row.unreadCount;
    }

    const pipeline = [
      {
        $match: {
          $or: [{ sender: userIdObj }, { receiver: userIdObj }],
          deleted: { $ne: true },
          hiddenFor: { $ne: userIdObj },
          // Exclude messages to/from blocked users
          sender: { $nin: blockedUserIds },
          receiver: { $nin: blockedUserIds },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userIdObj] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partnerUser",
        },
      },
      { $unwind: "$partnerUser" },
      {
        $lookup: {
          from: "profiles",
          localField: "_id",
          foreignField: "user",
          as: "partnerProfile",
        },
      },
      {
        $project: {
          partner: {
            _id: "$partnerUser._id",
            username: "$partnerUser.username",
            fullName: "$partnerUser.fullName",
            role: "$partnerUser.role",
            photo: { $arrayElemAt: ["$partnerProfile.photo", 0] },
          },
          lastMessage: 1,
        },
      },
    ];

    const conversations = await Message.aggregate(pipeline);
    const formatted = conversations.map((c) => ({
      partner: { ...c.partner, photo: c.partner.photo || "" },
      lastMessage: c.lastMessage,
      unreadCount: unreadMap[c._id?.toString()] || 0,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// ─── GET messages between two users (enforce block check) ─────────────────────
router.get("/:userId", requireAuth, requireRole, async (req, res, next) => {
  try {
    // Block guard — if either side has blocked, deny reading history too
    const block = await Block.findOne({
      $or: [
        { blocker: req.user.id, blocked: req.params.userId },
        { blocker: req.params.userId, blocked: req.user.id },
      ],
    }).lean();

    if (block) {
      // Return empty array — don't reveal block direction
      return res.json([]);
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
      hiddenFor: { $ne: req.user.id },
    })
      .populate("sender", "username fullName")
      .populate("replyTo", "text sender")
      .populate({
        path: "sharedPost",
        populate: [{ path: "author", select: "username fullName photo" }],
      })
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user.id,
        status: { $ne: "seen" },
      },
      { status: "seen" }
    );

    const partnerSocketId = getReceiverSocketId(req.params.userId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("message_seen", { partnerId: req.user.id });
    }

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// ─── CHECK if current user can message another user ───────────────────────────
router.get("/can-message/:userId", requireAuth, async (req, res, next) => {
  try {
    const result = await canSendMessage(req.user.id, req.params.userId);
    if (result.allowed) return res.json({ canMessage: true });

    // Map internal reasons to user-friendly messages without leaking block direction
    const friendlyReasons = {
      you_blocked: "you_blocked",           // only shown to the person who blocked
      unavailable: "messaging_unavailable", // generic — hides that THEY blocked YOU
      not_following: "not_following",
      pending_request: "pending_request",
      not_found: "not_found",
      self: "self",
    };

    return res.json({
      canMessage: false,
      reason: friendlyReasons[result.reason] || "messaging_unavailable",
    });
  } catch (err) {
    next(err);
  }
});

// ─── SEND message ─────────────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole, uploadLimiter, validateImage("image"), async (req, res, next) => {
  try {
    const { receiverId, text, replyTo, sharedPostId, image } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required." });
    }

    // Server-side permission guard — cannot be bypassed via direct API call
    const permission = await canSendMessage(req.user.id, receiverId);
    if (!permission.allowed) {
      return res.status(403).json({
        message: "messaging_not_allowed",
        reason: permission.reason === "you_blocked"
          ? "you_blocked"
          : "messaging_unavailable", // hide block direction from sender when THEY are blocked
      });
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const msg = new Message({
      sender: req.user.id,
      receiver: receiverId,
      // If only an image is sent, use a placeholder text so required:true is satisfied
      text: text?.trim() || (image ? "[Image]" : ""),
      status: initialStatus,
      replyTo: replyTo || null,
      sharedPost: sharedPostId || null,
      image: image || "",
    });

    if (!msg.text && !msg.image) {
      return res.status(400).json({ message: "Message must contain text or an image." });
    }

    // 1. Fire and save message and notification concurrently
    const newNotif = new Notification({
      recipient: receiverId,
      sender: req.user.id,
      type: "message",
      message: msg._id,
    });

    const [savedMsg, savedNotif] = await Promise.all([
      msg.save(),
      newNotif.save()
    ]);

    // 2. Populate both concurrently
    const [populated, populatedNotif] = await Promise.all([
      savedMsg.populate([
        { path: "sender", select: "username fullName" },
        { path: "replyTo", select: "text sender" },
        {
          path: "sharedPost",
          populate: [{ path: "author", select: "username fullName photo" }],
        },
      ]),
      savedNotif.populate("sender", "username fullName")
    ]);

    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", populated);
    if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populatedNotif);

    const senderSocketId = getReceiverSocketId(req.user.id);
    if (senderSocketId && initialStatus === "delivered") {
      io.to(senderSocketId).emit("message_delivered", {
        messageId: populated._id.toString(),
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE single message (soft delete for sender only) ──────────────────────
router.delete("/:messageId", requireAuth, async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your message" });
    }
    msg.text = "This message was deleted";
    msg.deleted = true;
    await msg.save();

    const receiverSocketId = getReceiverSocketId(msg.receiver.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_deleted", {
        messageId: msg._id.toString(),
      });
    }
    res.json({ messageId: msg._id, deleted: true });
  } catch (err) {
    next(err);
  }
});

// ─── CLEAR chat for current user only ─────────────────────────────────────────
router.delete("/clear/:partnerId", requireAuth, requireRole, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.partnerId;

    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId },
        ],
        hiddenFor: { $ne: userId },
      },
      { $push: { hiddenFor: userId } }
    );
    res.json({ message: "Chat cleared for you" });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE FOR ME only ────────────────────────────────────────────────────────
router.delete("/:messageId/for-me", requireAuth, async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (
      msg.sender.toString() !== req.user.id &&
      msg.receiver.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not your message" });
    }
    if (!msg.hiddenFor.includes(req.user.id)) {
      msg.hiddenFor.push(req.user.id);
      await msg.save();
    }
    res.json({ messageId: msg._id, hiddenForMe: true });
  } catch (err) {
    next(err);
  }
});

export default router;