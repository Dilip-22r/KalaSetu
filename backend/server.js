import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "50mb" }));

app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);
app.use("/profiles", profileRoutes);
app.use("/notifications", notificationRoutes);

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KalaSetu server running on port ${PORT}`);
});
