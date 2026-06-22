import { Server } from "socket.io";
import { Message } from "../models/Message.js";

// ── Shared state ──────────────────────────────────────────────────────
const userSocketMap = {};
export let io;

// ── Exported helper: get socket ID by userId ──────────────────────────
export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

// ── Called from server.js with the http.Server instance ──────────────
export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        /localhost:\d+$/,
        /\.vercel\.app$/,
        process.env.ALLOWED_ORIGIN || false,
      ].filter(Boolean),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // SOCKET EVENT: mark messages as seen
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
}