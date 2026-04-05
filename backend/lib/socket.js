import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import { Message } from "../models/Message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: [process.env.ALLOWED_ORIGIN || "http://localhost:5173"] },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("mark_seen", async ({ viewerId, partnerId }) => {
    // SECURITY: Ensure the socket taking the action actually belongs to the viewer
    if (String(userId) !== String(viewerId)) {
      console.warn(`[SECURITY] Socket ${socket.id} attempted to mark messages seen for user ${viewerId}`);
      return;
    }

    try {
      await Message.updateMany(
        { sender: partnerId, receiver: viewerId, status: { $ne: "seen" } },
        { status: "seen" }
      );
      const partnerSocketId = getReceiverSocketId(partnerId);
      if (partnerSocketId) io.to(partnerSocketId).emit("message_seen", { partnerId: viewerId });
    } catch (err) {
      console.error("mark_seen error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };