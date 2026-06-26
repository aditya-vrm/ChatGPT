const mongoose=require('mongoose');

async function ConnectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Connected to MongoDB")
    }catch(err){
        console.log("Not Connected DB",err)
    }
}

module.exports=ConnectDB;