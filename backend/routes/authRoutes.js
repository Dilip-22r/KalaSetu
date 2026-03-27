import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

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

export default router;