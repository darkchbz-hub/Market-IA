import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { registerChatSocket } from "./socket/chat-socket.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientUrls,
    credentials: true
  }
});

registerChatSocket(io);

server.listen(env.port, () => {
  console.log(`MarketZone backend escuchando en http://localhost:${env.port}`);
});
