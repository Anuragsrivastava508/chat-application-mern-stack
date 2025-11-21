import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersforSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersforSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ]
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendmessage = async (req, res) => {
  try {
    const { text, image } = req.body; // FIXED: was res.body
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

    await newMessage.save();

    // Emit message to receiver via Socket.IO
    const io = req.app.get("io");
    if (io) {
      const receiverSocketId = io.sockets.sockets.get(receiverId) || null;
      if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};




// import cloudinary from "../lib/cloudinary.js";
// import Message from "../models/message.model.js";
// import User from "../models/user.model.js";

// export const  getUsersforSidebar =async (req,res) => {
//     try 
//     {
//     const loggedInUserId =req.user._id;
//     const filteredUsers =await User.find({_id: {$ne:loggedInUserId}}).select("-password");

//     res.status(200).json(filteredUsers);
//     } catch (error) {
//         console.error("Error in getUsersforSidebar :",error.message);
//         res.status(500).json({error:"internal server error"});

//     }
// };


// export const getMessage =async (req,res) => {
//      try {
//         const  { id :userToChatId } =req.params
//         const  myId  = req.user._id;

//         const message =await Message.find({
//             $or:[
//                 {senderId : myId , receiverId : userToChatId },
//                 {senderId:userToChatId , receiverId : myId}
//             ]
//         })

//         res.status(200).json(message)

//      } catch (error) {
//           console.log("Error in getmessage :",error.message);
//         res.status(500).json({error:"internal server error"});
//      }   
//     }


// export const sendmessage =async (req,res) => {
//         try {
//             const{text, image} = res.body;
//             const {id:receiverId} = req.params;
//             const senderId = req.user._id;

//             let imageUrl;

//             if(image){
//                 const uploadResponse = await cloudinary.uploader.upload(image);
//                 imageUrl =uploadResponse.secure_url;
//             }

//         const  newMessage =new message({
//             senderId,
//             receiverId,
//             text,
//             image:imageUrl,
//         });

//         await newMessage.save();
//          // real time functionlity goes here => socket.io

//          res.status(201).json(newMessage)

//         } catch (error) {
//             console.log("Error in sendmessage  contollers:",error.message);
//         res.status(500).json({error:"internal server error"});
//         }
//     };