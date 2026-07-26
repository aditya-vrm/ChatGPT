const {Server} = require('socket.io');
const cookie = require("cookie");
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

function initSocketServer(httpserver){

    const io = new Server(httpserver, {})

    io.use(async(socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
        if(!cookies.token){
            return next(new Error('Authentication error:No Token provided'));
        }

        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            const user=await userModel.findById(decoded.id);

            socket.user = user;
            next();
        }catch (err) {
            return next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log("New Socket Connection Established", socket.id);
    });
}

module.exports=initSocketServer;