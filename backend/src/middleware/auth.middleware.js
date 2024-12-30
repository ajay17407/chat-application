import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


export const protectRoute = async(req,res,next) => {
       try{
         const token = req.cookies.jwt;

         if(!token)
         {
            return res.status(401).json({message:"Unauthorized - No Token Provided"});
         }

         const decoded = jwt.verify(token,process.env.JWT_SECRET);

         if(!decoded)
         {
            return res.status(401).json({message:"token invalid"});
         }

         const user = await User.findById(decoded.userId).select("-password");

         if(!user){
            return res.status(401).json({message:"document not found"});
         }

         req.user=user;

         next();

       }
       catch(err)
       {
        console.log("error in auth",err);
        res.status(500).json({message:"internal server error"});
       }
};