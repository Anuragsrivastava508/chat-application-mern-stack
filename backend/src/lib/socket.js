import { Server } from "socket.io";
import http from "http";
import express from "express";

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

/* ================= USER → SOCKET MAP ================= */
const userSocketMap = {};

export function getReceiverSocketIds(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🔥 Connected:", socket.id);

  const userId = socket.handshake.query.userId;

  /* ================= ONLINE USERS ================= */
  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  /* ================= DISCONNECT ================= */
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);

      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  /* ================= CALL SIGNALING ================= */

  /* 🔔 RING */
  socket.on("call-user", ({ to, callType }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;

    sockets.forEach((id) => {
      io.to(id).emit("incoming-call", {
        from: userId,
        callType,
      });
    });
  });

  /* 🔴 END CALL (ONLY OTHER SIDE) */
socket.on("end-call", ({ to }) => {
  console.log("END CALL EVENT RECEIVED", to);

  const sockets = userSocketMap[to];
  if (!sockets) {
    console.log("User sockets not found");
    return;
  }

  sockets.forEach((id) => {
    io.to(id).emit("call-ended");
  });
});
  /* ================= WEBRTC SIGNALING ================= */

  socket.on("webrtc-offer", ({ to, offer, callType }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;

    sockets.forEach((id) => {
      io.to(id).emit("webrtc-offer", {
        from: userId,
        offer,
        callType,
      });
    });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;

    sockets.forEach((id) => {
      io.to(id).emit("webrtc-answer", {
        from: userId,
        answer,
      });
    });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;

    sockets.forEach((id) => {
      io.to(id).emit("webrtc-ice", {
        from: userId,
        candidate,
      });
    });
  });
});

export { io, app, server };

