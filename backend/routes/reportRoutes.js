import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  getBlockedIds,
  getBlockStatus,
  reportUser,
  getAdminReports,
  updateAdminReport,
} from "../controllers/reportController.js";

// Re-export shared helper so other modules can import it from here (backward compat)
export { isBlockedInAnyDirection } from "../controllers/reportController.js";

const router = express.Router();

router.post("/block/:userId", requireAuth, blockUser);

router.post("/unblock/:userId", requireAuth, unblockUser);

router.get("/blocked", requireAuth, getBlockedUsers);

router.get("/blocked-ids", requireAuth, getBlockedIds);

router.get("/block-status/:userId", requireAuth, getBlockStatus);

router.post("/report/:userId", requireAuth, reportUser);

router.get("/admin/pending", requireAuth, getAdminReports);

router.put("/admin/:reportId", requireAuth, updateAdminReport);

export default router;