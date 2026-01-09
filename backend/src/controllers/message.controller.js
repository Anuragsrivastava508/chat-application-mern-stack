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
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
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


// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";

// import cloudinary from "../lib/cloudinary.js";
// import { getReceiverSocketId, io } from "../lib/socket.js";

// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;
//     const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     console.error("Error in getUsersForSidebar:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     }).sort({ createdAt: 1 }); // sort oldest → newest

//     res.status(200).json(messages);
//   } catch (error) {
//     console.error("Error in getMessages controller:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let imageUrl;
//     if (image) {
//       // image base64 upload to Cloudinary
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//     const saved = await newMessage.save();
//     const plain = saved.toObject ? saved.toObject() : saved;

//     // 🔥 realtime message delivery
//     const receiverSocketId = getReceiverSocketId(receiverId);
//     const senderSocketId = getReceiverSocketId(senderId);

//     // send message to receiver (if online)
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", plain);
//     }

//     // send same message back to sender (instant update, no delay)
//     if (senderSocketId) {
//       io.to(senderSocketId).emit("newMessage", plain);
//     }

//     // success response
//     res.status(201).json(plain);
//   } catch (error) {
//     console.error("Error in sendMessage controller:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
