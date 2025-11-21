import mongoose, { Types } from "mongoose";

const messageschema = new mongoose.Schema(
    {
        senderId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            required:true,
        },
          receiverId :{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            required:true,
           },
             text :{
             type:String, 
              },
             image:{
             type:String,
            },
          },     
             {timestamps:true}, 
  
);


const Message = mongoose.model("Message",messageschema);

export default Message;
