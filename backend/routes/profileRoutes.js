import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateImage, validatePdf } from "../middleware/imageValidationMiddleware.js";
import {
  getCreators,
  followUser,
  acceptFollow,
  rejectFollow,
  getFollowers,
  getFollowStatus,
  getFollowing,
  getProfile,
  upsertProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/creators", getCreators);

router.put("/:userId/follow", requireAuth, followUser);

router.put("/:userId/accept-follow", requireAuth, acceptFollow);

router.put("/:userId/reject-follow", requireAuth, rejectFollow);

router.get("/:userId/followers", getFollowers);

router.get("/:userId/follow-status", requireAuth, getFollowStatus);

router.get("/:userId/following", getFollowing);

router.get("/:userId", getProfile);

router.post("/", requireAuth, uploadLimiter, validateImage("photo"), validatePdf("verificationDocument"), upsertProfile);

export default router;
