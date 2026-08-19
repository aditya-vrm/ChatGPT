require("dotenv").config();
const express=require('express');
const app=require('./src/app');
const connectDB=require('./src/db/db');
const initSocketServer=require('./src/sockets/socket.server');
const httpserver=require('http').createServer(app);


connectDB();


initSocketServer(httpserver);

const PORT = process.env.PORT || 3000;
httpserver.listen(PORT,()=>{
    console.log(`Your Server is Running in ${PORT}`);
})