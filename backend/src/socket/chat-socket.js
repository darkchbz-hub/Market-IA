import { createMessage } from "../modules/messages/service.js";
import { verifyAccessToken } from "../shared/tokens.js";

export function registerChatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Token faltante en socket."));
    }

    try {
      socket.user = verifyAccessToken(token);
      return next();
    } catch {
      return next(new Error("Token invalido para socket."));
    }
  });

  io.on("connection", (socket) => {
    const room = socket.user.role === "admin" ? "admins" : `user:${socket.user.sub}`;
    socket.join(room);

    socket.on("chat:send", async (payload) => {
      try {
        const targetUserId =
          socket.user.role === "admin" && payload.userId ? payload.userId : socket.user.sub;

        const message = await createMessage({
          userId: targetUserId,
          senderRole: socket.user.role === "admin" ? "admin" : "customer",
          mensaje: payload.mensaje || payload.message
        });

        io.to(`user:${targetUserId}`).emit("chat:message", message);
        io.to("admins").emit("chat:message", message);
      } catch (error) {
        socket.emit("chat:error", {
          message: error.message || "No se pudo enviar el mensaje."
        });
      }
    });
  });
}
