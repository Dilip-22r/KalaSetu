import express from "express";
import { Profile } from "../models/Profile.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all artisans & NGOs (for search)
router.get("/creators", async (req, res) => {
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
    res.status(500).json({ message: err.message });
  }
});

// FOLLOW / UNFOLLOW user
router.put("/:userId/follow", requireAuth, async (req, res) => {
  try {
    if (req.params.userId === req.user.id)
      return res.status(400).json({ message: "Cannot follow yourself" });
    const target = await User.findById(req.params.userId);
    const me = await User.findById(req.user.id);
    if (!target || !me) return res.status(404).json({ message: "User not found" });
    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }
    await Promise.all([me.save(), target.save()]);
    res.json({ following: !isFollowing, followersCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET follow status
router.get("/:userId/follow-status", requireAuth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const isFollowing = me.following.includes(req.params.userId);
    const target = await User.findById(req.params.userId);
    res.json({ following: isFollowing, followersCount: target?.followers?.length || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET profile by userId
router.get("/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate(
      "user",
      "username fullName role email createdAt"
    );
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE or UPDATE profile
router.post("/", requireAuth, async (req, res) => {
  try {
    const { displayName, age, gender, skills, location, about, photo, userType } = req.body;
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
    res.status(500).json({ message: err.message });
  }
});

export default router;
