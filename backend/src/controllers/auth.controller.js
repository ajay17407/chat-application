import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bycrypt from 'bcryptjs';

export const signup = async(req,res) => {
   const {fullName,email,password} = req.body;
   try{

     if(!fullName || !email || !password)
     {
        return res.status(400).json({message:"please fill all fields"});
     }

     if(password.length < 6 ){
        return res.status(400).json({message:"please enter a longer password"});
     }
     const user =  await User.findOne({email});

     if(user){
        return res.status(400).json({message:"user already exists"});
     }
     
     const salt =  await bycrypt.genSalt(10);
     const hashedPassword = await bycrypt.hash(password,salt);

     const newUser = await User.create({
        fullName,
        email,
        password:hashedPassword,
     });

     if(newUser)
     {
        generateToken(newUser._id,res);
        res.status(201).json({
            _id:newUser._id,
            fullName:newUser.fullName,
            email:newUser.email,
            profilePic:newUser.profilePic,
        });
     }
     else{
         res.status(400).json({message:"user not created"});
     }


   }
   catch(err){
      console.log("error in signup",err);
      res.status(500).json({message:"internal server error"});
   }
};

export const login = async(req,res) => {
     const {email,password} =req.body;
     try{
        const user =  await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"invalid credentials"});
        }

        const isPasswordCorrect= await bycrypt.compare(password,user.password);
        if(!isPasswordCorrect)
        {
            return res.status(400).json({message:"invalid credentials"});
        }

        generateToken(user._id,res);

        res.status(200).json({
           _id:user._id,
           fullName:user.fullName,
           email:user.email,
           profilePic:user.profilePic,
        })
     }
     catch(err)
     {
        console.log("error in login",err);
        res.status(500).json({message:"internal server error"});
     }
};

export const logout = (req,res) => {
     try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"logged out successfully"});
     }
     catch(err){
        console.log("error in logout",err);
        res.status(500).json({message:"internal server error"});
     }
};

export const updateProfile = async(req,res) => {
     try{
        const {profilePic} = req.body;
        const userId= req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"pic not found"});
        }

        const uploadResponse = await cloudinary.uploader(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true});

        res.status(200).json(updatedUser);
     }
     catch(err){
        console.log("error in uploading pic",err);
        res.status(500).json({message:"internal server error"}); 
     }
};

export const checkAuth = (req,res)=> {
     try{
        res.json(req.user);
     }
     catch(err){
        console.log("error in checkAuth",err);
        res.status(500).json({message:"internal server error"});
     }
};