// // import express from "express";
// // import dotenv from "dotenv";
// // import cookieParser from "cookie-parser";
// // import cors from "cors";
// // import path from "path";

// // import { connectDB } from "./lib/db.js";

// // import authRoutes from "./routes/auth.route.js";
// // import messageRoutes from "./routes/message.route.js";
// // import { app, server } from "./lib/socket.js";

// // dotenv.config();

// // const PORT = process.env.PORT;
// // const __dirname = path.resolve();

// // // 🔹 Increase payload limit
// // app.use(express.json({ limit: "10mb" }));
// // app.use(express.urlencoded({ limit: "10mb", extended: true }));

// // app.use(cookieParser());
// // app.use(
// //   cors({
// //     origin: [
// //       "http://localhost:5173",
// //      "https://chatifys.onrender.com"    // 🔥 Render Backend URL
// //     ],
    
// //     credentials: true,
// //   })
// // );

// // app.use("/api/auth", authRoutes);
// // app.use("/api/messages", messageRoutes);

// // if (process.env.NODE_ENV === "production") {
// //   app.use(express.static(path.join(__dirname, "../frontend/dist")));

// //   app.get("*", (req, res) => {
// //     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
// //   });
// // }

// // server.listen(PORT, () => {
// //   console.log("server is running on PORT:" + PORT);
// //   connectDB();
// // });
// import express from "express";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import cors from "cors";

// import { connectDB } from "./lib/db.js";

// import authRoutes from "./routes/auth.route.js";
// import messageRoutes from "./routes/message.route.js";
// import { app, server } from "./lib/socket.js";

// dotenv.config();

// const PORT = process.env.PORT || 5001;

// // 🔹 Increase payload limit
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ limit: "10mb", extended: true }));

// app.use(cookieParser());

// // 🔥 CORS (localhost + your Render frontend)
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://chatifys.onrender.com"   // <-- your frontend URL
//     ],
//     credentials: true,
//   })
// );

// // 🔥 API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);

// // ❌ REMOVE FRONTEND SERVE BLOCK
// // Because frontend is deployed separately on Render Static Site
// // This block was causing ENOENT errors for missing dist folder.

// server.listen(PORT, () => {
//   console.log("server is running on PORT:" + PORT);
//   connectDB();
// });
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

// 🔹 Increase payload limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cookieParser());

// 🔥 FINAL CORS (DEV + PROD BOTH WORK)
const allowedOrigins = [
  "http://localhost:5173",
  "https://chatifys.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, etc.

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// 🔥 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// 🔥 Start server
server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});