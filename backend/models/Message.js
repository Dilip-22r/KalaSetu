import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:     { type: String, required: true },
    status:   { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    deleted:  { type: Boolean, default: false },   // deleted for everyone
    hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // deleted for me
    replyTo:  { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    image:    { type: String, default: "" }, // direct media sharing
  },
  { timestamps: true }
);

// High-performance compound indexes supporting Phase 3 Aggregation Pipeline searches
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);