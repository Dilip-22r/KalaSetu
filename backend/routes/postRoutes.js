import express from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Block } from "../models/Block.js";
import { requireAuth, optionalAuth, requireRole } from "../middleware/authMiddleware.js";
import { Notification } from "../models/Notification.js";
import { Profile } from "../models/Profile.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { uploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateImage } from "../middleware/imageValidationMiddleware.js";

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

// ─── Helper: attach profile photos to user objects ──────────────────────────
async function attachPhotosToUserObjects(items, isComment = false) {
  if (!items || (Array.isArray(items) && items.length === 0)) return items;

  const usersToFetch = new Set();
  const itemList = Array.isArray(items) ? items : [items];

  itemList.forEach((item) => {
    if (isComment) {
      if (item.author?._id) usersToFetch.add(String(item.author._id));
    } else {
      if (item.author?._id) usersToFetch.add(String(item.author._id));
      if (item.comments && item.comments.length > 0) {
        item.comments.forEach((c) => {
          if (c.author?._id) usersToFetch.add(String(c.author._id));
        });
      }
    }
  });

  if (usersToFetch.size === 0) return items;

  const profiles = await Profile.find({ user: { $in: Array.from(usersToFetch) } })
    .select("user photo")
    .lean();

  const photoMap = {};
  profiles.forEach((p) => {
    photoMap[String(p.user)] = p.photo;
  });

  itemList.forEach((item) => {
    if (item.author && photoMap[String(item.author._id)]) {
      item.author.photo = photoMap[String(item.author._id)];
    }
    if (!isComment && item.comments) {
      item.comments.forEach((c) => {
        if (c.author && photoMap[String(c.author._id)]) {
          c.author.photo = photoMap[String(c.author._id)];
        }
      });
    }
  });

  return items;
}

// ─── GET all posts — block-aware feed (paginated) ─────────────────────────────
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { search, category, author } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags:    { $in: [new RegExp(search, "i")] } },
      ];
    }
    // Handle auth or repost filters
    if (author && req.query.repostedBy) {
      // If both present, usually it's an 'OR' scenario for a profile
      if (filter.$or) {
        // Intersect logic is complex, just push author/reposted into an $and wrapping
        filter.$and = [
          { $or: filter.$or },
          { $or: [{ author: author }, { reposts: req.query.repostedBy }] }
        ];
        delete filter.$or;
      } else {
        filter.$or = [{ author: author }, { reposts: req.query.repostedBy }];
      }
    } else if (author) {
      filter.author = author;
    } else if (req.query.repostedBy) {
      filter.reposts = req.query.repostedBy;
    } else if (req.user?.id) {
      // Only apply block filter for general feed (not author-specific profiles)
      const blockedIds = await getBlockedUserIds(req.user.id);
      if (blockedIds.length > 0) {
        filter.author = { $nin: blockedIds };
      }
    }

    // Run count and fetch in parallel for speed
    const [total, posts] = await Promise.all([
      Post.countDocuments(filter),
      Post.find(filter)
        .populate("author", "username fullName role")
        .populate("comments.author", "username fullName role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    await attachPhotosToUserObjects(posts);

    res.json({
      posts,
      page,
      limit,
      total,
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    next(err);
  }
});


// ─── GET single post ───────────────────────────────────────────────────────────
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username fullName role")
      .populate("comments.author", "username fullName role")
      .lean();
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Block check: neither party should be able to fetch the other's post by ID
    if (req.user?.id) {
      const blockedIds = await getBlockedUserIds(req.user.id);
      if (blockedIds.includes(String(post.author._id))) {
        return res.status(403).json({ message: "Post not available." });
      }
    }

    await attachPhotosToUserObjects(post);

    res.json(post);
  } catch (err) {
    next(err);
  }
});

// ─── GET post likers ───────────────────────────────────────────────────────────
router.get("/:id/likes", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes",
      "username fullName"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post.likes);
  } catch (err) {
    next(err);
  }
});

// ─── GET post dislikers ────────────────────────────────────────────────────────
router.get("/:id/dislikes", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "dislikes",
      "username fullName"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post.dislikes || []);
  } catch (err) {
    next(err);
  }
});

// ─── CREATE post ──────────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole, uploadLimiter, validateImage("image"), async (req, res, next) => {
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
    const leanPost = populated.toObject();
    await attachPhotosToUserObjects(leanPost);
    res.status(201).json(leanPost);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE post ──────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your post" });
    }
    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
});

// ─── LIKE / UNLIKE post — block-aware ────────────────────────────────────────
router.put("/:id/like", requireAuth, async (req, res, next) => {
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
    next(err);
  }
});

// ─── DISLIKE / UNDISLIKE post — block-aware ───────────────────────────────────
router.put("/:id/dislike", requireAuth, async (req, res, next) => {
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
    next(err);
  }
});

// ─── REPOST — block-aware ────────────────────────────────────────────────────
router.put("/:id/repost", requireAuth, async (req, res, next) => {
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
    next(err);
  }
});

// ─── ADD comment — block-aware ────────────────────────────────────────────────
router.post("/:id/comments", requireAuth, async (req, res, next) => {
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
    const newComment = post.comments[post.comments.length - 1].toObject();
    await attachPhotosToUserObjects(newComment, true);
    res.json(newComment);
  } catch (err) {
    next(err);
  }
});

// ─── GET comments ─────────────────────────────────────────────────────────────
router.get("/:id/comments", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("comments.author", "username fullName role")
      .lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    await attachPhotosToUserObjects(post.comments, true);
    res.json(post.comments);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE comment ───────────────────────────────────────────────────────────
router.delete("/:id/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Allow deleting only if the user is the author of the comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your comment" });
    }

    // Pull the comment
    post.comments.pull(req.params.commentId);
    await post.save();
    
    res.json({ message: "Comment deleted", commentId: req.params.commentId });
  } catch (err) {
    next(err);
  }
});

// ─── EDIT post ────────────────────────────────────────────────────────────────
router.put("/:id", requireAuth, uploadLimiter, validateImage("image"), async (req, res, next) => {
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
    const leanPost = populated.toObject();
    await attachPhotosToUserObjects(leanPost);
    res.json(leanPost);
  } catch (err) {
    next(err);
  }
});

export default router;