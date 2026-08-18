const express=require('express');
const cookieParser=require('cookie-parser');

/* Routes */
const AuthRoutes=require('./routes/auth.routes');
const ChatRoutes=require('./routes/chat.routes');

const app=express();

app.use(express.json());
app.use(cookieParser());

/* Using Routes */
app.use('/api/auth',AuthRoutes);
app.use('/api/chat',ChatRoutes);



module.exports=app;