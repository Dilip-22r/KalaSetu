import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./lib/socket.js";

// ── Create HTTP server from the Express app ───────────────────────────
const server = http.createServer(app);

// ── Attach Socket.IO to the HTTP server ──────────────────────────────
initSocket(server);

// ── Connect to MongoDB ────────────────────────────────────────────────
connectDB();

// ── Start listening ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KalaSetu server running on port ${PORT}`);
});