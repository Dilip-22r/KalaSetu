import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateImage } from "../middleware/imageValidationMiddleware.js";
import {
  getConversations,
  checkCanMessage,
  getMessages,
  sendMessage,
  deleteMessage,
  clearChat,
  deleteMessageForMe,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/conversations", requireAuth, getConversations);

router.get("/can-message/:userId", requireAuth, checkCanMessage);

router.get("/:userId", requireAuth, getMessages);

router.post("/", requireAuth, uploadLimiter, validateImage("image"), sendMessage);

router.delete("/clear/:partnerId", requireAuth, clearChat);

router.delete("/:messageId/for-me", requireAuth, deleteMessageForMe);

router.delete("/:messageId", requireAuth, deleteMessage);

export default router;