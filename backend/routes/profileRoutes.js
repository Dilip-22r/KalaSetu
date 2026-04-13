import express from "express";
import { Profile } from "../models/Profile.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { Notification } from "../models/Notification.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import jwt from "jsonwebtoken";
import { uploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateImage, validatePdf } from "../middleware/imageValidationMiddleware.js";

const router = express.Router();

// GET all artisans & NGOs (for search)
router.get("/creators", async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const userFilter = { role: { $in: ["artisan", "ngo"] } };
    if (type) userFilter.role = type.toLowerCase();

    const users = await User.find(userFilter).select("-password").lean();
    const userIds = users.map((u) => u._id);

    const profileFilter = { user: { $in: userIds } };
    if (search) {
      profileFilter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const profiles = await Profile.find(profileFilter).populate("user", "username fullName role email").lean();
    res.json(profiles);
  } catch (err) {
    next(err);
  }
});

// FOLLOW / UNFOLLOW user
router.put("/:userId/follow", requireAuth, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id)
      return res.status(400).json({ message: "Cannot follow yourself" });
    const target = await User.findById(req.params.userId);
    const me = await User.findById(req.user.id);
    if (!target || !me) return res.status(404).json({ message: "User not found" });

    if (target.role === "user") {
      return res.status(400).json({ message: "Members cannot be followed" });
    }

    const targetProfile = await Profile.findOne({ user: target._id });
    const isPrivate = targetProfile?.isPrivate || false;

    const isFollowing = me.following.includes(target._id);
    const hasRequested = target.followRequests?.includes(me._id);

    if (isFollowing) {
      // Unfollow
      me.following.pull(target._id);
      target.followers.pull(me._id);
      await Promise.all([me.save(), target.save()]);
      return res.json({ status: "unfollowed", following: false, followersCount: target.followers.length });
    }

    if (hasRequested) {
      // Cancel follow request
      target.followRequests.pull(me._id);
      await target.save();
      return res.json({ status: "request_cancelled", requested: false });
    }

    if (isPrivate) {
      // Send a follow request
      if (!target.followRequests) target.followRequests = [];
      target.followRequests.push(me._id);
      await target.save();

      // Emit Notification
      const newNotif = new Notification({
        recipient: target._id,
        sender: me._id,
        type: "follow_request",
      });
      await newNotif.save();
      const populated = await newNotif.populate("sender", "username fullName");
      const receiverSocketId = getReceiverSocketId(target._id.toString());
      if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populated);

      return res.json({ status: "requested", requested: true });
    }

    // Direct follow
    me.following.push(target._id);
    target.followers.push(me._id);
    await Promise.all([me.save(), target.save()]);

    // Emit Notification
    const newNotif = new Notification({
      recipient: target._id,
      sender: me._id,
      type: "follow",
    });
    await newNotif.save();
    const populated = await newNotif.populate("sender", "username fullName");
    const receiverSocketId = getReceiverSocketId(target._id.toString());
    if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populated);

    res.json({ status: "followed", following: true, followersCount: target.followers.length });
  } catch (err) {
    next(err);
  }
});

// ACCEPT follow request
router.put("/:userId/accept-follow", requireAuth, async (req, res, next) => {
  try {
    const requesterId = req.params.userId;
    const me = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!me || !requester) return res.status(404).json({ message: "User not found" });

    if (me.followRequests?.includes(requesterId)) {
      me.followRequests.pull(requesterId);
      if (!me.followers.includes(requesterId)) me.followers.push(requesterId);
      if (!requester.following.includes(me._id)) requester.following.push(me._id);
      await Promise.all([me.save(), requester.save()]);

      // Notify requester that their request was accepted
      const newNotif = new Notification({
        recipient: requester._id,
        sender: me._id,
        type: "follow_accept",
      });
      await newNotif.save();

      const populated = await newNotif.populate("sender", "username fullName");
      const receiverSocketId = getReceiverSocketId(requester._id.toString());
      if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populated);
    }
    
    // Update the original request notification so the owner sees "You accepted"
    // (Run this outside the block to catch old legacy notifications that got stuck)
    await Notification.updateMany(
      { recipient: me._id, sender: requester._id, type: "follow_request" },
      { type: "follow_accepted_by_me" }
    );
      
    res.json({ message: "Follow request accepted", followersCount: me.followers.length });
  } catch (err) {
    next(err);
  }
});

// REJECT follow request
router.put("/:userId/reject-follow", requireAuth, async (req, res, next) => {
  try {
    const requesterId = req.params.userId;
    const me = await User.findById(req.user.id);

    if (!me) return res.status(404).json({ message: "User not found" });

    if (me.followRequests?.includes(requesterId)) {
      me.followRequests.pull(requesterId);
      await me.save();
    }
    
    // Update the original request notification so the owner sees it was rejected
    // (Run outside block to clean up stuck legacy notifications)
    await Notification.updateMany(
      { recipient: me._id, sender: requesterId, type: "follow_request" },
      { type: "follow_rejected_by_me" }
    );

    // Notify requester that their request was declined
    const newNotif = new Notification({
      recipient: requesterId,
      sender: me._id,
      type: "follow_reject",
    });
    await newNotif.save();

    const populated = await newNotif.populate("sender", "username fullName");
    const receiverSocketId = getReceiverSocketId(requesterId.toString());
    if (receiverSocketId) io.to(receiverSocketId).emit("newNotification", populated);
    
    res.json({ message: "Follow request rejected" });
  } catch (err) {
    next(err);
  }
});

// GET followers list for a user (access-controlled)
router.get("/:userId/followers", async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const targetProfile = await Profile.findOne({ user: req.params.userId });
    const isPrivate = targetProfile?.isPrivate || false;

    // For private profiles, check if the requester is an approved follower or the owner
    if (isPrivate) {
      const authHeader = req.headers.authorization;
      let requesterId = null;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          requesterId = decoded.id || decoded._id;
        } catch { /* invalid/missing token — treat as guest */ }
      }

      const isOwner = requesterId && requesterId.toString() === req.params.userId;
      const isFollower = requesterId && targetUser.followers.some(f => f.toString() === requesterId.toString());

      if (!isOwner && !isFollower) {
        return res.status(403).json({ message: "This profile is private. Only followers can view the followers list." });
      }
    }

    // Populate followers with profile photo
    const populatedUser = await User.findById(req.params.userId)
      .populate("followers", "username fullName _id");

    // Attach profile photos
    const followerIds = populatedUser.followers.map(f => f._id);
    const profiles = await Profile.find({ user: { $in: followerIds } }).select("user photo displayName");
    const photoMap = {};
    profiles.forEach(p => { photoMap[p.user.toString()] = { photo: p.photo, displayName: p.displayName }; });

    const followers = populatedUser.followers.map(f => ({
      _id: f._id,
      username: f.username,
      fullName: f.fullName,
      photo: photoMap[f._id.toString()]?.photo || null,
      displayName: photoMap[f._id.toString()]?.displayName || null,
    }));

    res.json({ followers, total: followers.length });
  } catch (err) {
    next(err);
  }
});

// GET follow status
router.get("/:userId/follow-status", requireAuth, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.id);
    const isFollowing = me.following.includes(req.params.userId);
    const target = await User.findById(req.params.userId);
    const hasRequested = target?.followRequests?.includes(me._id) || false;
    res.json({
      following: isFollowing,
      requested: hasRequested,
      followersCount: target?.followers?.length || 0,
      followingCount: target?.following?.length || 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET following list for a user
router.get("/:userId/following", async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const targetProfile = await Profile.findOne({ user: req.params.userId });
    const isPrivate = targetProfile?.isPrivate || false;

    if (isPrivate) {
      const authHeader = req.headers.authorization;
      let requesterId = null;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          requesterId = decoded.id || decoded._id;
        } catch { /* invalid token — treat as guest */ }
      }
      const isOwner = requesterId && requesterId.toString() === req.params.userId;
      const isFollower = requesterId && targetUser.followers.some(f => f.toString() === requesterId.toString());
      if (!isOwner && !isFollower) {
        return res.status(403).json({ message: "This profile is private. Only followers can view the following list." });
      }
    }

    const populatedUser = await User.findById(req.params.userId)
      .populate("following", "username fullName _id");

    const followingIds = populatedUser.following.map(f => f._id);
    const profiles = await Profile.find({ user: { $in: followingIds } }).select("user photo displayName");
    const photoMap = {};
    profiles.forEach(p => { photoMap[p.user.toString()] = { photo: p.photo, displayName: p.displayName }; });

    const following = populatedUser.following.map(f => ({
      _id: f._id,
      username: f.username,
      fullName: f.fullName,
      photo: photoMap[f._id.toString()]?.photo || null,
      displayName: photoMap[f._id.toString()]?.displayName || null,
    }));

    res.json({ following, total: following.length });
  } catch (err) {
    next(err);
  }
});

// GET profile by userId
router.get("/:userId", async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate(
      "user",
      "username fullName role email createdAt"
    );

    if (!profile) {
      // Check if the user exists even if they don't have a profile record
      const user = await User.findById(req.params.userId).select("username fullName role email createdAt");
      if (!user) return res.status(404).json({ message: "User not found" });

      // Return a basic profile object for standard members
      return res.json({ user });
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// CREATE or UPDATE profile
router.post("/", requireAuth, uploadLimiter, validateImage("photo"), validatePdf("verificationDocument"), async (req, res, next) => {
  try {
    const { displayName, age, gender, skills, location, about, photo, userType, organizationName, verificationDocument, organizationId, isPrivate, notificationRetentionDays } = req.body;
    let profile = await Profile.findOne({ user: req.user.id });

    // Only update fields that were explicitly sent (allows partial updates like photo removal)
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (skills !== undefined) updates.skills = skills;
    if (location !== undefined) updates.location = location;
    if (about !== undefined) updates.about = about;
    if (photo !== undefined) updates.photo = photo;
    if (userType !== undefined) updates.userType = userType;
    if (organizationName !== undefined) updates.organizationName = organizationName;
    if (verificationDocument !== undefined) updates.verificationDocument = verificationDocument;
    if (organizationId !== undefined) updates.organizationId = organizationId;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;
    if (notificationRetentionDays !== undefined) updates.notificationRetentionDays = notificationRetentionDays;

    if (profile) {
      Object.assign(profile, updates);
      await profile.save();
    } else {
      profile = await Profile.create({
        user: req.user.id,
        ...updates,
      });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
