import express from "express";
import { requireAuth, optionalAuth, requireRole } from "../middleware/authMiddleware.js";
import { uploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateImage } from "../middleware/imageValidationMiddleware.js";
import {
  getPosts,
  getPostById,
  getPostLikers,
  getPostDislikers,
  createPost,
  deletePost,
  likePost,
  dislikePost,
  repostPost,
  addComment,
  getComments,
  deleteComment,
  editPost,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/", optionalAuth, getPosts);

router.get("/:id", optionalAuth, getPostById);

router.get("/:id/likes", getPostLikers);

router.get("/:id/dislikes", getPostDislikers);

router.post("/", requireAuth, requireRole, uploadLimiter, validateImage("image"), createPost);

router.delete("/:id", requireAuth, deletePost);

router.put("/:id/like", requireAuth, likePost);

router.put("/:id/dislike", requireAuth, dislikePost);

router.put("/:id/repost", requireAuth, repostPost);

router.post("/:id/comments", requireAuth, addComment);

router.get("/:id/comments", getComments);

router.delete("/:id/comments/:commentId", requireAuth, deleteComment);

router.put("/:id", requireAuth, uploadLimiter, validateImage("image"), editPost);

export default router;