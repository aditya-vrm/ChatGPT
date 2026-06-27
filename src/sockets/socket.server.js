const {Server} = require('socket.io');

function initSocketServer(httpserver){

    const io = new Server(httpserver, {});

    io.on('connection', (socket) => {
        console.log("New Socker Connection Established", socket.id);
    
    });
}

module.exports=initSocketServer;