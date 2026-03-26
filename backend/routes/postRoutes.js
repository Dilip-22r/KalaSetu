import express from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to get user from token (optional auth)
const optionalAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const requireRole = async (req, res, next) => {
  try {
    const dbUser = await User.findById(req.user.id).select("role");
    if (!dbUser || dbUser.role === "user") {
      return res.status(403).json({ message: "Only artisans and NGOs can perform this action" });
    }
    req.user.role = dbUser.role; // keep in sync
    next();
  } catch {
    res.status(500).json({ message: "Server error checking role" });
  }
};

// GET all posts (public) with optional search
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
    const posts = await Post.find(filter)
      .populate("author", "username fullName role")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username fullName role");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE post (artisan/ngo only)
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

// DELETE post (author only)
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

// LIKE/UNLIKE post
router.put("/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const idx = post.likes.indexOf(req.user.id);
    if (idx === -1) post.likes.push(req.user.id);
    else post.likes.splice(idx, 1);
    await post.save();
    res.json({ likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
// EDIT post (author only)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: "Not your post" });
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