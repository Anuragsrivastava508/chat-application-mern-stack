 import jwt from "jsonwebtoken";
 import User from "../models/user.model.js";

 export const protectRoutes =async (req,res,next) => {
    try {
        const  token = req.cookies.jwt;

        if(!token){
            return res.status(401).json({message:"Unauthorized -No Token provide"})
        }
  
        const decoded = jwt.verify (token, process.env.JWT_SECRET)

        if(!decoded){
          return res.status(401).json({message:"Unauthorized -invalid Token "})
        }
         
        const user =await User.findById(decoded.userID).select("-password");

        if(!user){
            return res.status(404).json({message:"404 user is not found"})
        }

        req.user =user
        next()
    } catch (error) {
    console.log("error in protectroutes middleware",error.message);
    res.status(500).json({message:"internal server error "});
    }
};