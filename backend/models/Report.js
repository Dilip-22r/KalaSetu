import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "misinformation",
        "impersonation",
        "inappropriate_content",
        "other",
      ],
      required: true,
    },
    // Optional free-text capped at 500 chars (enforced in route + here)
    details: {
      type: String,
      default: "",
      maxlength: [500, "Details cannot exceed 500 characters"],
    },
    // Moderation workflow status
    status: {
      type: String,
      enum: ["pending", "under_review", "action_taken", "dismissed", "escalated"],
      default: "pending",
    },
    // Admin notes written during moderation
    adminNotes: {
      type: String,
      default: "",
    },
    // Which admin handled this
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Allow multiple reports over time by different users for the same target.
// We no longer enforce a unique compound index so an admin can see fresh reports
// even after resolving an earlier one from the same reporter.
// Instead use a partial index to prevent spamming PENDING reports:
reportSchema.index(
  { reporter: 1, reportedUser: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "unique_pending_report",
  }
);

// Admin dashboard: list all pending reports sorted by newest
reportSchema.index({ status: 1, createdAt: -1 });

// Quickly count how many times a user has been reported
reportSchema.index({ reportedUser: 1, status: 1 });

export const Report = mongoose.model("Report", reportSchema);