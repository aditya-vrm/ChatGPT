const chatModel=require('../models/chat.model');

async function createChat(req,res){
    
    const title=req.body;
    const users=req.body.users;

    const chat=new chatModel({
        users:users._id,
        title:title
    });

    res.status(201).json({
        message:"Chat Created Successfully",
        chat:{
            id:chat._id,
            title:chat.title,
            lastActivity:chat.lastActivity,
            users:chat.users
        }
    });

    
}

module.exports={createChat};