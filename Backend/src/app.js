const express=require('express');
const cookieParser=require('cookie-parser');
const cors=require('cors');
const path=require('path');

/* Routes */
const AuthRoutes=require('./routes/auth.routes');
const ChatRoutes=require('./routes/chat.routes');

const app=express();

/* Middlewares */

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://chatgpt-bfup.onrender.com'
        ];
        const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app');
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

/* Using Routes */
app.use('/api/auth',AuthRoutes);
app.use('/api/chat',ChatRoutes);

app.get("*name", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});



module.exports=app;