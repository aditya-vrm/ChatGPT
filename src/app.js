const express=require('express');
const cookieParser=require('cookie-parser');
const AuthRoutes=require('./routes/auth.routes');

const app=express();

app.use(express.json());
app.use(cookieParser());


app.use('/api/auth',AuthRoutes);



module.exports=app;