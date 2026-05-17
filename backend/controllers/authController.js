import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Profile } from "../models/Profile.js";
import { Post } from "../models/Post.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";

// ── POST /auth/signup ────────────────────────────────────────────────
export const signup = async (req, res, next) => {
  try {
    const { fullName, email, username, password, role } = req.body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({ message: "Full name is required." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "A valid email address is required." });
    }
    if (!username || typeof username !== "string" || !/^[a-zA-Z0-9_.]{3,30}$/.test(username.trim())) {
      return res.status(400).json({ message: "Username must be 3–30 alphanumeric characters." });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

// ── POST /auth/login ─────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...safeUser } = user.toObject();
    res.json({ message: "Login successful", token, user: safeUser });
  } catch (error) {
    next(error);
  }
};

// ── PUT /auth/upgrade-role ────────────────────────────────────────────
export const upgradeRole = async (req, res, next) => {
  try {
    const { userId, newRole } = req.body;

    if (String(userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden: You cannot change another user's role" });
    }
    if (!["artisan", "ngo"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { id: updatedUser._id, role: updatedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Role updated successfully", user: updatedUser, token });
  } catch (error) {
    next(error);
  }
};

// ── GET /auth/user/:id ────────────────────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── PUT /auth/change-password ─────────────────────────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /auth/account ──────────────────────────────────────────────
export const deleteAccount = async (req, res, next) => {
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

    // 1. Remove userId from User arrays
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }, { followRequests: userId }] },
      { $pull: { followers: userId, following: userId, followRequests: userId } },
      { session }
    );

    // 2. Remove userId from Post lists
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
};
