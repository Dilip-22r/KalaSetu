import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["event", "artwork", "story", "workshop", "announcement"],
      default: "story",
    },
    tags: [String],
    image: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Feed: sorted by date (most common query — all posts, newest first)
postSchema.index({ createdAt: -1 });

// Feed filtered by category + date (category filter on home page)
postSchema.index({ category: 1, createdAt: -1 });

// Posts by a specific author (used on profile page)
postSchema.index({ author: 1, createdAt: -1 });

// Text search across title, content, tags
postSchema.index({ title: "text", content: "text", tags: "text" });

export const Post = mongoose.model("Post", postSchema);

