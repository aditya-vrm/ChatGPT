const chatModel=require('../models/chat.model');

async function createChat(req,res){
    
    const title=req.body;
    const user=req.user;

    const chat=new chatModel({
        user:user._id,
        title
    });

    res.status(201).json({
        message:"Chat Created Successfully",
        chat:{
            _id:chat._id,
            title:chat.title,
            lastActivity:chat.lastActivity,
            user:chat.user
        }
    });

    
}

module.exports={createChat};