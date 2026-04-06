import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "message", "follow", "follow_request", "follow_accept", "follow_accepted_by_me", "follow_rejected_by_me"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for faster querying of user notifications sorted by creation date
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Compound index for unread count query: countDocuments({ recipient, read: false })
notificationSchema.index({ recipient: 1, read: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
