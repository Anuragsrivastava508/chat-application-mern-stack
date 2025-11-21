import express from "express";

import { protectRoutes } from "../middleware/auth.middleware.js";

import { getUsersforSidebar,getMessage,sendmessage } from "../controllers/message.controller.js";

const router = express.Router();



router.get("/users",protectRoutes,getUsersforSidebar);

router.get("/:id",protectRoutes , getMessage);

router.post("/send/:id",protectRoutes, sendmessage );

export default router;