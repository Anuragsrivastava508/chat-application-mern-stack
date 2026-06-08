import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chatifys.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};
const activeOffers = new Map(); // "callerId->receiverId"

export function getReceiverSocketIds(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🔥 Connected:", socket.id);
  const userId = socket.handshake.query.userId;

  if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  /* ===== CALL SIGNALING ===== */

  socket.on("call-user", ({ to, callType }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;
    sockets.forEach((id) => {
      io.to(id).emit("incoming-call", { from: userId, callType });
    });
  });

  socket.on("end-call", ({ to }) => {
    console.log("END CALL:", userId, "->", to);
    // ✅ Clear offer lock so next call works
    activeOffers.delete(`${userId}->${to}`);
    activeOffers.delete(`${to}->${userId}`);

    const sockets = userSocketMap[to];
    if (!sockets) return;
    sockets.forEach((id) => io.to(id).emit("call-ended"));
  });

  /* ===== WEBRTC SIGNALING ===== */

  socket.on("webrtc-offer", ({ to, offer, callType }) => {
    const key = `${userId}->${to}`;

    // ✅ Block duplicate offers
    if (activeOffers.has(key)) {
      console.log(`[webrtc-offer] DUPLICATE BLOCKED: ${key}`);
      return;
    }
    activeOffers.set(key, true);
    console.log(`[webrtc-offer] forwarded: ${key}`);

    const sockets = userSocketMap[to];
    if (!sockets) return;
    sockets.forEach((id) => {
      io.to(id).emit("webrtc-offer", { from: userId, offer, callType });
    });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;
    sockets.forEach((id) => {
      io.to(id).emit("webrtc-answer", { from: userId, answer });
    });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;
    sockets.forEach((id) => {
      io.to(id).emit("webrtc-ice", { from: userId, candidate });
    });
  });

  /* ===== TYPING INDICATORS ===== */

  socket.on("typing", async ({ to }) => {
    try {
      const typingUser = await User.findById(userId).select("fullName").lean();
      const sockets = userSocketMap[to];
      if (!sockets) return;
      
      const userName = typingUser?.fullName || "User";
      sockets.forEach((id) => {
        io.to(id).emit("user-typing", { from: userId, name: userName });
      });
    } catch (e) {
      console.error("Error in typing event:", e);
      // Continue silently - don't break the socket connection
    }
  });

  socket.on("stop-typing", ({ to }) => {
    try {
      const sockets = userSocketMap[to];
      if (!sockets) return;
      sockets.forEach((id) => {
        io.to(id).emit("user-stop-typing", { from: userId });
      });
    } catch (e) {
      console.error("Error in stop-typing event:", e);
    }
  });
});

export { io, app, server };