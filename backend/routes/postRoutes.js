import express from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Block } from "../models/Block.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/authMiddleware.js";
import { Notification } from "../models/Notification.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const router = express.Router();

// ─── Helper: get all user IDs the current user should not see ─────────────────
async function getBlockedUserIds(userId) {
  if (!userId) return [];
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  })
    .select("blocker blocked")
    .lean();
  return blocks.map((b) =>
    String(b.blocker) === String(userId) ? String(b.blocked) : String(b.blocker)
  );
}

// ─── GET all posts — block-aware feed ─────────────────────────────────────────
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // If logged in, hide posts from blocked users (both directions)
    if (req.user?.id) {
      const blockedIds = await getBlockedUserIds(req.user.id);
      if (blockedIds.length > 0) {
        filter.author = { $nin: blockedIds };
      }
    }

    const posts = await Post.find(filter)
      .populate("author", "username fullName role")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET single post ───────────────────────────────────────────────────────────
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username fullName role"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Block check: neither party should be able to fetch the other's post by ID
    if (req.user?.id) {
      const blockedIds = await getBlockedUserIds(req.user.id);
      if (blockedIds.includes(String(post.author._id))) {
        return res.status(403).json({ message: "Post not available." });
      }
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET post likers ───────────────────────────────────────────────────────────
router.get("/:id/likes", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes",
      "username fullName"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post.likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CREATE post ──────────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole, async (req, res) => {
  try {
    const { title, content, category, tags, image } = req.body;
    const post = new Post({
      author: req.user.id,
      title,
      content,
      category: category || "story",
      tags: tags || [],
      image: image || "",
    });
    await post.save();
    const populated = await post.populate("author", "username fullName role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE post ──────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your post" });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LIKE / UNLIKE post — block-aware ────────────────────────────────────────
router.put("/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent liking if either party has blocked the other
    const blockedIds = await getBlockedUserIds(req.user.id);
    if (blockedIds.includes(String(post.author))) {
      return res.status(403).json({ message: "Action not available." });
    }

    const idx = post.likes.indexOf(req.user.id);
    const dislikeIdx = post.dislikes?.indexOf(req.user.id);

    if (idx === -1) {
      post.likes.push(req.user.id);
      if (dislikeIdx !== undefined && dislikeIdx !== -1) {
        post.dislikes.splice(dislikeIdx, 1);
      }
      await post.save();

      if (post.author.toString() !== req.user.id) {
        const existing = await Notification.findOne({
          recipient: post.author,
          sender: req.user.id,
          type: "like",
          post: post._id,
        });
        if (!existing) {
          const newNotif = new Notification({
            recipient: post.author,
            sender: req.user.id,
            type: "like",
            post: post._id,
          });
          await newNotif.save();
          const populated = await newNotif.populate(
            "sender",
            "username fullName"
          );
          const receiverSocketId = getReceiverSocketId(
            post.author.toString()
          );
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newNotification", populated);
          }
        }
      }
    } else {
      post.likes.splice(idx, 1);
      await post.save();
      if (post.author.toString() !== req.user.id) {
        await Notification.deleteOne({
          recipient: post.author,
          sender: req.user.id,
          type: "like",
          post: post._id,
        });
      }
    }

    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DISLIKE / UNDISLIKE post — block-aware ───────────────────────────────────
router.put("/:id/dislike", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const blockedIds = await getBlockedUserIds(req.user.id);
    if (blockedIds.includes(String(post.author))) {
      return res.status(403).json({ message: "Action not available." });
    }

    if (!post.dislikes) post.dislikes = [];
    const idx = post.dislikes.indexOf(req.user.id);
    const likeIdx = post.likes.indexOf(req.user.id);

    if (idx === -1) {
      post.dislikes.push(req.user.id);
      if (likeIdx !== -1) {
        post.likes.splice(likeIdx, 1);
        if (post.author.toString() !== req.user.id) {
          await Notification.deleteOne({
            recipient: post.author,
            sender: req.user.id,
            type: "like",
            post: post._id,
          });
        }
      }
    } else {
      post.dislikes.splice(idx, 1);
    }
    await post.save();
    res.json({ dislikes: post.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── REPOST — block-aware ────────────────────────────────────────────────────
router.put("/:id/repost", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const blockedIds = await getBlockedUserIds(req.user.id);
    if (blockedIds.includes(String(post.author))) {
      return res.status(403).json({ message: "Action not available." });
    }

    const idx = post.reposts.indexOf(req.user.id);
    if (idx === -1) post.reposts.push(req.user.id);
    else post.reposts.splice(idx, 1);
    await post.save();
    res.json({ reposts: post.reposts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADD comment — block-aware ────────────────────────────────────────────────
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent commenting if either party has blocked the other
    const blockedIds = await getBlockedUserIds(req.user.id);
    if (blockedIds.includes(String(post.author))) {
      return res.status(403).json({ message: "Action not available." });
    }

    const text = (req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required." });

    const comment = { author: req.user.id, text };
    post.comments.push(comment);
    await post.save();
    await post.populate("comments.author", "username fullName role");
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET comments ─────────────────────────────────────────────────────────────
router.get("/:id/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "comments.author",
      "username fullName role"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── EDIT post ────────────────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your post" });
    }
    const { title, content, category, tags, image } = req.body;
    post.title = title ?? post.title;
    post.content = content ?? post.content;
    post.category = category ?? post.category;
    post.tags = tags ?? post.tags;
    post.image = image ?? post.image;
    await post.save();
    const populated = await post.populate("author", "username fullName role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;