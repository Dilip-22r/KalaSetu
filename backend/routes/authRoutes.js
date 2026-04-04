import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { Post } from "../models/Post.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { message: "Too many attempts, please try again later" },
});

const router = express.Router();
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, username, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...safeUser } = user.toObject();
    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put("/upgrade-role", async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    if (!["artisan", "ngo"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    );

    // Issue a fresh token with the updated role
    const token = jwt.sign(
      { id: updatedUser._id, role: updatedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Role updated successfully",
      user: updatedUser,
      token,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET user by ID (for messaging context)
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE User Account (Hard Delete with deep cascading)
router.delete("/account", requireAuth, deleteAccountLimiter, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: "Incorrect password" });
    }

    // 1. Remove userId from User arrays (followers, following, followRequests)
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }, { followRequests: userId }] },
      { $pull: { followers: userId, following: userId, followRequests: userId } },
      { session }
    );

    // 2. Remove userId from Post lists (likes, dislikes, reposts)
    await Post.updateMany(
      { $or: [{ likes: userId }, { dislikes: userId }, { reposts: userId }] },
      { $pull: { likes: userId, dislikes: userId, reposts: userId } },
      { session }
    );

    // 3. Remove comments authored by user
    await Post.updateMany(
      { "comments.author": userId },
      { $pull: { comments: { author: userId } } },
      { session }
    );

    // 4. Delete dependent data
    await Post.deleteMany({ author: userId }, { session });
    await Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }, { session });
    await Notification.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }, { session });

    // 5. Delete core records
    await Profile.deleteOne({ user: userId }, { session });
    await User.deleteOne({ _id: userId }, { session });

    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ message: "Account entirely erased" });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    res.status(500).json({ message: error.message || "Failed to delete account" });
  }
});

export default router;