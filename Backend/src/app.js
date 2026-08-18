const express=require('express');
const cookieParser=require('cookie-parser');
const cors=require('cors');

/* Routes */
const AuthRoutes=require('./routes/auth.routes');
const ChatRoutes=require('./routes/chat.routes');

const app=express();

/* Middlewares */

app.use(cors(
    {
        origin: 'http://localhost:3000',
        credentials: true
    }
));
app.use(express.json());
app.use(cookieParser());

/* Using Routes */
app.use('/api/auth',AuthRoutes);
app.use('/api/chat',ChatRoutes);



module.exports=app;