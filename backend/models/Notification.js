import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "message"], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for faster querying of user notifications sorted by creation date
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
