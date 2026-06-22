import { Report } from "../models/Report.js";
import { Block } from "../models/Block.js";
import { User } from "../models/User.js";

// ── Shared helper ─────────────────────────────────────────────────────
export async function isBlockedInAnyDirection(userAId, userBId) {
  const block = await Block.findOne({
    $or: [{ blocker: userAId, blocked: userBId }, { blocker: userBId, blocked: userAId }],
  }).lean();
  return !!block;
}

const VALID_REASONS = ["spam", "harassment", "hate_speech", "misinformation", "impersonation", "inappropriate_content", "other"];

// ── POST /reports/block/:userId ───────────────────────────────────────
export const blockUser = async (req, res, next) => {
  try {
    const blockerId = req.user.id;
    const blockedId = req.params.userId;
    if (String(blockerId) === String(blockedId)) return res.status(400).json({ message: "You cannot block yourself." });
    const targetUser = await User.findById(blockedId).select("_id").lean();
    if (!targetUser) return res.status(404).json({ message: "User not found." });
    await Block.findOneAndUpdate({ blocker: blockerId, blocked: blockedId }, { blocker: blockerId, blocked: blockedId }, { upsert: true, new: true });
    await User.findByIdAndUpdate(blockerId, { $pull: { following: blockedId, followers: blockedId, followRequests: blockedId } });
    await User.findByIdAndUpdate(blockedId, { $pull: { following: blockerId, followers: blockerId, followRequests: blockerId } });
    return res.json({ message: "User blocked successfully.", blocked: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ message: "User is already blocked.", blocked: true });
    next(err);
  }
};

// ── POST /reports/unblock/:userId ─────────────────────────────────────
export const unblockUser = async (req, res, next) => {
  try {
    await Block.findOneAndDelete({ blocker: req.user.id, blocked: req.params.userId });
    return res.json({ message: "User unblocked.", blocked: false });
  } catch (err) { next(err); }
};

// ── GET /reports/blocked ──────────────────────────────────────────────
export const getBlockedUsers = async (req, res, next) => {
  try {
    const blocks = await Block.find({ blocker: req.user.id }).populate("blocked", "username fullName _id").lean();
    return res.json({ blockedUsers: blocks.map((b) => b.blocked) });
  } catch (err) { next(err); }
};

// ── GET /reports/blocked-ids ──────────────────────────────────────────
export const getBlockedIds = async (req, res, next) => {
  try {
    const blocks = await Block.find({ $or: [{ blocker: req.user.id }, { blocked: req.user.id }] }).select("blocker blocked").lean();
    const ids = blocks.map((b) => String(b.blocker) === String(req.user.id) ? String(b.blocked) : String(b.blocker));
    return res.json({ blockedIds: [...new Set(ids)] });
  } catch (err) { next(err); }
};

// ── GET /reports/block-status/:userId ────────────────────────────────
export const getBlockStatus = async (req, res, next) => {
  try {
    const [iBlockedThem, theyBlockedMe] = await Promise.all([
      Block.findOne({ blocker: req.user.id, blocked: req.params.userId }).lean(),
      Block.findOne({ blocker: req.params.userId, blocked: req.user.id }).lean(),
    ]);
    return res.json({ isBlocked: !!iBlockedThem, isBlockedByThem: !!theyBlockedMe });
  } catch (err) { next(err); }
};

// ── POST /reports/report/:userId ──────────────────────────────────────
export const reportUser = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const reportedUserId = req.params.userId;
    if (String(reporterId) === String(reportedUserId)) return res.status(400).json({ message: "You cannot report yourself." });
    const targetUser = await User.findById(reportedUserId).select("_id").lean();
    if (!targetUser) return res.status(404).json({ message: "User not found." });
    const { reason, details } = req.body;
    if (!reason || !VALID_REASONS.includes(reason)) return res.status(400).json({ message: "A valid reason is required.", validReasons: VALID_REASONS });
    const sanitizedDetails = (details || "").trim().slice(0, 500);
    const report = await Report.findOneAndUpdate(
      { reporter: reporterId, reportedUser: reportedUserId, status: "pending" },
      { reporter: reporterId, reportedUser: reportedUserId, reason, details: sanitizedDetails, status: "pending" },
      { upsert: true, new: true }
    );
    return res.status(201).json({ message: "Report submitted. Our team will review it shortly.", reportId: report._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "You have already reported this user. Our team is reviewing it." });
    next(err);
  }
};

// ── GET /reports/admin/pending ────────────────────────────────────────
export const getAdminReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const statusFilter = req.query.status || "pending";
    const reports = await Report.find({ status: statusFilter }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("reporter", "username fullName email").populate("reportedUser", "username fullName email").lean();
    const total = await Report.countDocuments({ status: statusFilter });
    return res.json({ reports, total, page, hasMore: page * limit < total });
  } catch (err) { next(err); }
};

// ── PUT /reports/admin/:reportId ──────────────────────────────────────
export const updateAdminReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ["pending", "under_review", "action_taken", "dismissed", "escalated"];
    if (!status || !validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status." });
    const report = await Report.findByIdAndUpdate(req.params.reportId, { status, adminNotes: (adminNotes || "").trim().slice(0, 1000), reviewedBy: req.user.id, reviewedAt: new Date() }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found." });
    return res.json({ message: "Report updated.", report });
  } catch (err) { next(err); }
};
