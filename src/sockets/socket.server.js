const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpserver) {
  const io = new Server(httpserver, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    if (!cookies.token) {
      return next(new Error("Authentication error:No Token provided"));
    }
    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);

      console.log("User Found:", user);

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    
    
    socket.on("ai-message", async (messagepayload) => {


      const message = await messageModel.create({
        chat: messagepayload.chat,
        user: socket.user._id,
        content: messagepayload.content,
        role: "user",
      });

      const vectors = await aiService.generateVector(messagepayload.content);

      const memory=await queryMemory({
        queryVector:vectors,
        limit: 3,
        metadata: {
          user: socket.user._id,
          chat: messagepayload.chat,
        },
      });

      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: messagepayload.chat,
          user: socket.user._id,
          text: messagepayload.content,
        },
      });


      const chatHistory = await messageModel.find({
        chat: messagepayload.chat,
      }).sort({ createdAt: -1 }).limit(20).lean();

      const stm=chatHistory.map(item=>{
        return{
          role: item.role,
          parts: [{ text: item.content }]
        }
      })

      const ltm=[
        {
          role: "system",
          parts: [{ text: `
            
            These are the some previous messages from the chat , use them to answer the Response.

            ${memory.map(item=>item.metadata.text).join("\n")}
            `}]
        }
      ]

      const response = await aiService.generateResponse([...ltm,...stm]);

      const responseMessage = await messageModel.create({
        chat: messagepayload.chat,
        user: socket.user._id,
        content: response,
        role: "model",
      });

      const responseVector = await aiService.generateVector(response)

      await createMemory({
        vectors: responseVector,
        messageId: responseMessage._id,
        metadata: {
          chat: messagepayload.chat,
          user: socket.user._id,
          text: response,
        },
      }); 

      socket.emit("ai-response", {
        content: response,
        chat: messagepayload.chat,
        text: response,
      });
    });
  });
}

module.exports = initSocketServer;
