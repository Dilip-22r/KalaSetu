import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);
app.use("/profiles", profileRoutes);

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`KalaSetu server running on port ${PORT}`);
});
