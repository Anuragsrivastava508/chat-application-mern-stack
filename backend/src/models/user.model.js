import mongoose, { Types } from "mongoose";

const userschema = new mongoose.Schema(
    {
        email:{
            type:String,
            required:true,
            unique:true,
        },

        fullName:{
             type:String,
            required:true,
            unique:true,
        },
        password:{
             type:String,
            required:true,
            minlenght:8,
        },

        profilePic:{
            type:String,
            default:"",
        }
    },
    {
        timestamps:true
    }
);


const User = mongoose.model("User",userschema);

export default User;