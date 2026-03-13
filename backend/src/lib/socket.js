// // // import { Server } from "socket.io";
// // // import http from "http";
// // // import express from "express";

// // // const app = express();
// // // const server = http.createServer(app);

// // // const io = new Server(server, {
// // //   cors: {
// // //     origin: [
// // //       "http://localhost:5173",          // local development
// // //       "https://chatifys.onrender.com"   // 🔥 Your frontend URL (Render)
// // //     ],
// // //     methods: ["GET", "POST"],
// // //     credentials: true,                  // 🔥 REQUIRED so cookie & auth work
// // //   },
// // // });

// // // // used to store online users
// // // const userSocketMap = {}; // { userId: socketId }

// // // export function getReceiverSocketId(userId) {
// // //   return userSocketMap[userId];
// // // }

// // // io.on("connection", (socket) => {
// // //   console.log("🔥 Client connected:", socket.id);

// // //   const userId = socket.handshake.query.userId;

// // //   if (userId) {
// // //     userSocketMap[userId] = socket.id;
// // //     console.log("🟢 USER ONLINE:", userId);
// // //   }

// // //   // send list of online users
// // //   io.emit("getOnlineUsers", Object.keys(userSocketMap));

// // //   socket.on("disconnect", () => {
// // //     console.log("❌ Client disconnected:", socket.id);

// // //     if (userId) delete userSocketMap[userId];

// // //     io.emit("getOnlineUsers", Object.keys(userSocketMap));
// // //   });
// // // });

// // // export { io, app, server };
// // import { Server } from "socket.io";
// // import http from "http";
// // import express from "express";

// // const app = express();
// // const server = http.createServer(app);

// // const io = new Server(server, {
// //   cors: {
// //     origin: [
// //       "http://localhost:5173",
// //       "https://chatifys.onrender.com"
// //     ],
// //     methods: ["GET", "POST"],
// //     credentials: true,
// //   },
// // });

// // const userSocketMap = {}; // userId → socketId

// // export function getReceiverSocketId(userId) {
// //   return userSocketMap[userId];
// // }

// // io.on("connection", (socket) => {
// //   console.log("🔥 Client connected:", socket.id);

// //   const userId = socket.handshake.query.userId;

// //   if (userId) {
// //     userSocketMap[userId] = socket.id;
// //     console.log("🟢 ONLINE:", userId);
// //   }

// //   io.emit("getOnlineUsers", Object.keys(userSocketMap));

// //   socket.on("disconnect", () => {
// //     console.log("❌ DISCONNECTED:", socket.id);

// //     if (userId) delete userSocketMap[userId];

// //     io.emit("getOnlineUsers", Object.keys(userSocketMap));
// //   });
// // });

// // export { io, app, server };


// import { Server } from "socket.io";
// import http from "http";
// import express from "express";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",
//       "https://chatifys.onrender.com",
//     ],
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// const userSocketMap = {}; // userId → Set(socketId)

// export function getReceiverSocketIds(userId) {
//   return userSocketMap[userId];
// }

// io.on("connection", (socket) => {
//   console.log("🔥 Connected:", socket.id);

//   const userId = socket.handshake.query.userId;

//   if (userId) {
//     if (!userSocketMap[userId]) {
//       userSocketMap[userId] = new Set();
//     }
//     userSocketMap[userId].add(socket.id);
//     console.log("🟢 ONLINE:", userId);
//   }

//   io.emit("getOnlineUsers", Object.keys(userSocketMap));

//   socket.on("disconnect", () => {
//     console.log("❌ Disconnected:", socket.id);

//     if (userId && userSocketMap[userId]) {
//       userSocketMap[userId].delete(socket.id);

//       if (userSocketMap[userId].size === 0) {
//         delete userSocketMap[userId];
//       }
//     }

//     io.emit("getOnlineUsers", Object.keys(userSocketMap));
//   });

//   /* ================= CALL SIGNALING ================= */

//   socket.on("call-user", ({ to, callType }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("incoming-call", {
//         from: userId,
//         callType, // "audio" | "video"
//       });
//     });
//   });

//   socket.on("accept-call", ({ to }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("call-accepted", { from: userId });
//     });
//   });

//   socket.on("reject-call", ({ to }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("call-rejected", { from: userId });
//     });
//   });
// });



// export { io, app, server };

// ye latest wala ka up date hao
// import { Server } from "socket.io";
// import http from "http";
// import express from "express";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: [
//       "http://localhost:5173",
//       "https://chatifys.onrender.com",
//     ],
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// // userId → Set(socketId)
// const userSocketMap = {};

// export function getReceiverSocketIds(userId) {
//   return userSocketMap[userId];
// }

// io.on("connection", (socket) => {
//   console.log("🔥 Connected:", socket.id);

//   const userId = socket.handshake.query.userId;

//   // ---------------- ONLINE USERS ----------------
//   if (userId) {
//     if (!userSocketMap[userId]) {
//       userSocketMap[userId] = new Set();
//     }
//     userSocketMap[userId].add(socket.id);
//     console.log("🟢 ONLINE:", userId);
//   }

//   io.emit("getOnlineUsers", Object.keys(userSocketMap));

//   socket.on("disconnect", () => {
//     console.log("❌ Disconnected:", socket.id);

//     if (userId && userSocketMap[userId]) {
//       userSocketMap[userId].delete(socket.id);
//       if (userSocketMap[userId].size === 0) {
//         delete userSocketMap[userId];
//       }
//     }

//     io.emit("getOnlineUsers", Object.keys(userSocketMap));
//   });

//   // ================= CALL SIGNALING =================

//   socket.on("call-user", ({ to, callType }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("incoming-call", {
//         from: userId,
//         callType, // "audio" | "video"
//       });
//     });
//   });

//   socket.on("accept-call", ({ to }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("call-accepted", { from: userId });
//     });
//   });

//   socket.on("reject-call", ({ to }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("call-rejected", { from: userId });
//     });
//   });

//   // ================= WEBRTC SIGNALING =================
//   // 🔥 THIS IS REQUIRED FOR REAL AUDIO / VIDEO

//   // OFFER
//   socket.on("webrtc-offer", ({ to, offer }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("webrtc-offer", {
//         from: userId,
//         offer,
//       });
//     });
//   });

//   // ANSWER
//   socket.on("webrtc-answer", ({ to, answer }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("webrtc-answer", {
//         from: userId,
//         answer,
//       });
//     });
//   });

//   // ICE CANDIDATE
//   socket.on("webrtc-ice", ({ to, candidate }) => {
//     const sockets = userSocketMap[to];
//     if (!sockets) return;

//     sockets.forEach((id) => {
//       io.to(id).emit("webrtc-ice", {
//         from: userId,
//         candidate,
//       });
//     });
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
  // socket.on("end-call", ({ to }) => {
  //   const sockets = userSocketMap[to];
  //   if (!sockets) return;

  //   sockets.forEach((id) => {
  //     io.to(id).emit("call-ended");
  //   });
  // });
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

  socket.on("webrtc-offer", ({ to, offer }) => {
    const sockets = userSocketMap[to];
    if (!sockets) return;

    sockets.forEach((id) => {
      io.to(id).emit("webrtc-offer", {
        from: userId,
        offer,
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

