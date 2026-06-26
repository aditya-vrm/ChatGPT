require("dotenv").config();
const express=require('express');
const app=require('./src/app');
const connectDB=require('./src/db/db');


connectDB();


app.use(express());

app.listen(3000,()=>{
    console.log('Your Server is Running in 3000');
})