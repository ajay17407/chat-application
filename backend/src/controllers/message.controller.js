import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceveiverSocketId } from "../lib/socket.js";
import {io} from '../lib/socket.js';

export const getUsersForSidebar = async(req,res) => {
    try{
      const loggedInUserId = req.user._id;

      const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");
      
      res.status(200).json(filteredUsers);
    }
    catch(err){
        console.log("error in getting users for sidebar",err);
        res.status(500).json({message:"internal server error"});
    }
};

export const getMessages = async(req,res) => {
     try{
        const userToChatId  =  req.params.id;
        const senderId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:senderId,receiverId:userToChatId},
                {senderId:userToChatId,receiverId:senderId}
            ]
        });

        res.status(200).json(messages);
     }
     catch(err){
        console.log("error in getting messages with recipient ",err);
        res.status(500).json({message:"internal server error"});
     }
};


export const sendMessage = async(req,res) => {
     try{
        const {text,image} = req.body;
        const receiverId = req.params.id;
        const senderId= req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl =  uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl,
        });

        await newMessage.save();

        const receveiverSocketId = getReceveiverSocketId(receiverId);
        if(receveiverSocketId){
            io.to(receveiverSocketId).emit("newMessage",newMessage);
        }

        res.status(201).json(newMessage);
        
     }
     catch(err)
     {
        console.log("error in sending messages to the  recipient ",err);
        res.status(500).json({message:"internal server error"});
     
     }
};