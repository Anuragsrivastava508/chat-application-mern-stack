
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";


export const signup =  async  (req, res) => {

const {fullName,email,password} =req.body;

try {
  if(!fullName || !email || !password)
    {
     return res.status(400).json({message:"all feild must be requried"});
    }
    //hashing the password
    if(password.length < 8){
        return res.status(400).json({message:"password must be at least 8 character"});
    }
    const user = await User.findOne({email})
    if(user)   return res.status(400).json({message:"email is already is exists"});
    
const salt = await bcrypt.genSalt(10)
const hashedPassword =await bcrypt.hash(password,salt)

const newUser =new User ({
    fullName,
    email,
    password:hashedPassword
})

if (newUser) {
  //genretae token 
  generateToken(newUser._id,res)
  await newUser.save();
  res.status(201).json({
_id:newUser._id,
fullName:newUser.fullName,
email:newUser.email,
profilePic :newUser.profilePic,
  });  
} else {
res.status(400).json({message:"Invalid user data"});    
}


} catch (error) {
    console.log("error in signup controller",error.message);
    res.status(500).json({message:"internal server error "});
}

};

export const login = async (req, res) => {
const{email,password}=req.body;
  try {
    const user = await User.findOne({email}) 
    if(!user)
    {
      return res.status(400).json({message:"invalid credential"})
    }
 const ispasswordcorrect  = await bcrypt.compare(password ,user.password);
 if(!ispasswordcorrect){
  return res.status(400).json({message:"invalid credential"});
 }

 generateToken(user._id,res)

 res.status(200).json({
  _id:user._id,
  fullName:user.fullName,
  email:user.email,
  profilePic:user.profilePic,
 });
  } catch (error) {
     console.log("error in signup controller",error.message);
    res.status(500).json({message:"internal server error "});
  }
};

export const logout = (req, res) => {
try {
  res.cookie("jwt","",{maxAge:0});
res.status(200).json({message:"logout successfuly"});
} catch (error) {
   console.log("error in logout controller",error.message);
    res.status(500).json({message:"internal server error "});
}
};

// export const updateProfile = async (req,res) => {
//   try {
//     const {profilePic}=req.body;
//     const userID =req.user._id;
   
//     if(!profilePic){
//       return req.status(400).json({message:"profile pic is requreid"});
//     }

//     const uploadResponse =await cloudinary.uploader.upload(profilePic);
//     const updateuser =await User.findByIdAndUpdate(
//       userID,
//       {profilePic:uploadResponse.secure_url},
//       { new:true}
//     );
//     res.status(200).json(updateduser);
//   }
//  catch (error) {
//      console.log("error in profilepic controller",error.message);
//     res.status(500).json({message:"internal server error "});
//   }
// };

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    const updateData = {};

    // Only upload to cloudinary if profilePic is received
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: error.message });
  }
};




export const checkAuth =  (req,res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
     console.log("error in profilepic controller",error.message);
    res.status(500).json({message:"internal server error "});
  }
}