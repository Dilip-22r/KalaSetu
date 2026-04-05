import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { Report } from "../models/Report.js";
import { Block } from "../models/Block.js";
import { User } from "../models/User.js";

const router = express.Router();

// ─── Shared helper ────────────────────────────────────────────────────────────
/**
 * Returns true if userA has blocked userB OR userB has blocked userA.
 * Import this in any route that needs to enforce block restrictions.
 */
export async function isBlockedInAnyDirection(userAId, userBId) {
  const block = await Block.findOne({
    $or: [
      { blocker: userAId, blocked: userBId },
      { blocker: userBId, blocked: userAId },
    ],
  }).lean();
  return !!block;
}

// ─── BLOCK ────────────────────────────────────────────────────────────────────

// POST /reports/block/:userId
router.post("/block/:userId", requireAuth, async (req, res) => {
  try {
    const blockerId = req.user.id;
    const blockedId = req.params.userId;

    if (String(blockerId) === String(blockedId)) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const targetUser = await User.findById(blockedId).select("_id").lean();
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    // Idempotent upsert
    await Block.findOneAndUpdate(
      { blocker: blockerId, blocked: blockedId },
      { blocker: blockerId, blocked: blockedId },
      { upsert: true, new: true }
    );

    // Remove follow relationships in both directions
    await User.findByIdAndUpdate(blockerId, {
      $pull: {
        following: blockedId,
        followers: blockedId,
        followRequests: blockedId,
      },
    });
    await User.findByIdAndUpdate(blockedId, {
      $pull: {
        following: blockerId,
        followers: blockerId,
        followRequests: blockerId,
      },
    });

    return res.json({ message: "User blocked successfully.", blocked: true });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key — already blocked, still success
      return res.json({ message: "User is already blocked.", blocked: true });
    }
    res.status(500).json({ message: err.message });
  }
});

// POST /reports/unblock/:userId
router.post("/unblock/:userId", requireAuth, async (req, res) => {
  try {
    await Block.findOneAndDelete({
      blocker: req.user.id,
      blocked: req.params.userId,
    });
    return res.json({ message: "User unblocked.", blocked: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /reports/blocked — list all users blocked by the current user
router.get("/blocked", requireAuth, async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.user.id })
      .populate("blocked", "username fullName _id")
      .lean();
    const blockedUsers = blocks.map((b) => b.blocked);
    return res.json({ blockedUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /reports/blocked-ids — lightweight: just the IDs (for feed filtering)
router.get("/blocked-ids", requireAuth, async (req, res) => {
  try {
    const blocks = await Block.find({
      $or: [{ blocker: req.user.id }, { blocked: req.user.id }],
    })
      .select("blocker blocked")
      .lean();

    const ids = blocks.map((b) =>
      String(b.blocker) === String(req.user.id)
        ? String(b.blocked)
        : String(b.blocker)
    );

    return res.json({ blockedIds: [...new Set(ids)] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /reports/block-status/:userId — check block in both directions
router.get("/block-status/:userId", requireAuth, async (req, res) => {
  try {
    const [iBlockedThem, theyBlockedMe] = await Promise.all([
      Block.findOne({ blocker: req.user.id, blocked: req.params.userId }).lean(),
      Block.findOne({ blocker: req.params.userId, blocked: req.user.id }).lean(),
    ]);

    return res.json({
      isBlocked: !!iBlockedThem,       // I blocked them
      isBlockedByThem: !!theyBlockedMe, // They blocked me
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── REPORT ───────────────────────────────────────────────────────────────────

const VALID_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "impersonation",
  "inappropriate_content",
  "other",
];

// POST /reports/report/:userId
router.post("/report/:userId", requireAuth, async (req, res) => {
  try {
    const reporterId = req.user.id;
    const reportedUserId = req.params.userId;

    if (String(reporterId) === String(reportedUserId)) {
      return res.status(400).json({ message: "You cannot report yourself." });
    }

    const targetUser = await User.findById(reportedUserId).select("_id").lean();
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    const { reason, details } = req.body;

    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        message: "A valid reason is required.",
        validReasons: VALID_REASONS,
      });
    }

    // Sanitize details: strip leading/trailing whitespace, cap at 500 chars
    const sanitizedDetails = (details || "").trim().slice(0, 500);

    // Use upsert on pending reports to avoid duplicate pending spam.
    // Once a report is resolved/dismissed, a new pending one can be created.
    const report = await Report.findOneAndUpdate(
      { reporter: reporterId, reportedUser: reportedUserId, status: "pending" },
      {
        reporter: reporterId,
        reportedUser: reportedUserId,
        reason,
        details: sanitizedDetails,
        status: "pending",
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: "Report submitted. Our team will review it shortly.",
      reportId: report._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "You have already reported this user. Our team is reviewing it.",
      });
    }
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN ROUTES (add role guard before going to production) ─────────────────

// GET /reports/admin/pending — list all pending reports (admin only in future)
router.get("/admin/pending", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const statusFilter = req.query.status || "pending";

    const reports = await Report.find({ status: statusFilter })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("reporter", "username fullName email")
      .populate("reportedUser", "username fullName email")
      .lean();

    const total = await Report.countDocuments({ status: statusFilter });

    return res.json({ reports, total, page, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /reports/admin/:reportId — update report status (admin action)
router.put("/admin/:reportId", requireAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ["pending", "under_review", "action_taken", "dismissed", "escalated"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      {
        status,
        adminNotes: (adminNotes || "").trim().slice(0, 1000),
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: "Report not found." });
    return res.json({ message: "Report updated.", report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;