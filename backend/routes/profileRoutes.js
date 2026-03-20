import express from "express";
import { Profile } from "../models/Profile.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

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

// GET all artisans & NGOs (for search)
router.get("/creators", async (req, res) => {
  try {
    const { search, type } = req.query;
    const userFilter = { role: { $in: ["artisan", "ngo"] } };
    if (type) userFilter.role = type.toLowerCase();

    const users = await User.find(userFilter).select("-password");
    const userIds = users.map((u) => u._id);

    const profileFilter = { user: { $in: userIds } };
    if (search) {
      profileFilter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const profiles = await Profile.find(profileFilter).populate("user", "username fullName role email");
    res.json(profiles);
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
    if (profile) {
      Object.assign(profile, { displayName, age, gender, skills, location, about, photo, userType });
      await profile.save();
    } else {
      profile = await Profile.create({
        user: req.user.id,
        displayName, age, gender, skills, location, about, photo, userType,
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
