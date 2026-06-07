import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";

/* ================= GET USERS ================= */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ================= GET MESSAGES ================= */
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ================= SEND MESSAGE ================= */
export const sendMessage = async (req, res) => {
  try {
    const { text, image, document } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(400).json({ error: "Failed to upload image" });
      }
    }

    // Validate document base64 size (limit to 10MB for safety)
    if (document && document.base64 && document.base64.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Document size too large (max 10MB)" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      document: document ? { base64: document.base64, name: document.name, type: document.type } : undefined,
    });

    const savedMessage = await newMessage.save();
    const message = savedMessage.toObject();

    /* 🔥 REALTIME DELIVERY (MULTI-TAB SAFE) */

    const receiverSocketIds = getReceiverSocketIds(receiverId);
    const senderSocketIds = getReceiverSocketIds(senderId);

    // send to receiver
    if (receiverSocketIds) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", message);
      });
    }

    // send back to sender (instant UI update)
    if (senderSocketIds) {
      senderSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", message);
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

