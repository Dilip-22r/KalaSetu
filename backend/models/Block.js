import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blocked: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Unique: a user can only block another once
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Fast reverse lookup: "who has blocked ME?" — used in message and feed guards
blockSchema.index({ blocked: 1, blocker: 1 });

export const Block = mongoose.model("Block", blockSchema);