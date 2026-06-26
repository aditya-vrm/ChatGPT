const userModel=require('../models/user.model');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');


async function registerUser(req,res){
    
    const{fullname:{firstname,lastname},email,password}=req.body;

    const isUserAlreadyExist=await userModel.findOne({email});

    if(isUserAlreadyExist){
        return res.status(401).json({message:"User Already Exist"});
    }

    const hashPassword=await bcrypt.hash(password,10);

    const user=await userModel.create({
        fullname:{
            firstname,lastname
        },
        email,
        password:hashPassword,
    })

    const token=jwt.sign({id:user._id},process.env.JWT_SECRET);

    res.cookie(token);

    res.status(201).json({
        message:"User Registered Succesfully",
        user:{
            email:user.email,
            id:user._id,
            fullname:user.fullname,
        }

    })

}

async function loginUser(req,res){

const{email,password}=req.body;

const user=await userModel.findOne({
    email
})
 if(!user){
    res.status(401).json({message:"User not Found"});
 }

 const isPasswordValid=await bcrypt.compare(password,user.password);

 if(!isPasswordValid){
    res.status(401).json({message:"Invalid Password"})
 }

 const token=jwt.sign({id:user._id},process.env.JWT_SECRET);

res.cookie(token);

 res.status(201).json({
    message:"User Logged in Succesfully",
    user:{
        email:user.email,
        id:user._id,
        fullname:user.fullname,
    }
    
});

}

module.exports={
    registerUser,
    loginUser
}