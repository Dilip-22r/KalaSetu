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
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);