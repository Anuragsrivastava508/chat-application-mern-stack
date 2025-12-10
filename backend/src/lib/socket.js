// import { Server } from "socket.io";
// import http from "http";
// import express from "express";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",          // local development
//       "https://chatifys.onrender.com"   // 🔥 Your frontend URL (Render)
//     ],
//     methods: ["GET", "POST"],
//     credentials: true,                  // 🔥 REQUIRED so cookie & auth work
//   },
// });

// // used to store online users
// const userSocketMap = {}; // { userId: socketId }

// export function getReceiverSocketId(userId) {
//   return userSocketMap[userId];
// }

// io.on("connection", (socket) => {
//   console.log("🔥 Client connected:", socket.id);

//   const userId = socket.handshake.query.userId;

//   if (userId) {
//     userSocketMap[userId] = socket.id;
//     console.log("🟢 USER ONLINE:", userId);
//   }

//   // send list of online users
//   io.emit("getOnlineUsers", Object.keys(userSocketMap));

//   socket.on("disconnect", () => {
//     console.log("❌ Client disconnected:", socket.id);

//     if (userId) delete userSocketMap[userId];

//     io.emit("getOnlineUsers", Object.keys(userSocketMap));
//   });
// });

// export { io, app, server };
import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chatifys.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {}; // userId → socketId

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("🔥 Client connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("🟢 ONLINE:", userId);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("❌ DISCONNECTED:", socket.id);

    if (userId) delete userSocketMap[userId];

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };


