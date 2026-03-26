import { Server } from "socket.io";
import http from "http";
import express from "express";
import { Message } from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// {userId: socketId} map for efficient O(1) online user lookups
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Push updated online list to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ── mark_seen ─────────────────────────────────────────────────────────────
  // Emitted by the receiver when they open a conversation.
  // Updates all unread messages from partnerId → viewerId to "seen" in DB,
  // then notifies the partner so their ticks turn blue in real time.
  socket.on("mark_seen", async ({ viewerId, partnerId }) => {
    try {
      await Message.updateMany(
        { sender: partnerId, receiver: viewerId, status: { $ne: "seen" } },
        { status: "seen" }
      );

      const partnerSocketId = getReceiverSocketId(partnerId);
      if (partnerSocketId) {
        io.to(partnerSocketId).emit("message_seen", { partnerId: viewerId });
      }
    } catch (err) {
      console.error("mark_seen error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
