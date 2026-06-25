import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { createAssistantMessage, createMessage, listConversation, listThreads } from "./service.js";

export const messagesRouter = Router();

messagesRouter.use(authenticate);

messagesRouter.get(
  "/threads",
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const items = await listThreads();
    res.json({ items });
  })
);

messagesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await listConversation({
      viewerRole: req.auth.role,
      viewerId: req.auth.sub,
      targetUserId: req.query.userId
    });

    res.json({ items });
  })
);

messagesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const message = await createMessage({
      userId: req.auth.role === "admin" ? req.body?.userId : req.auth.sub,
      senderRole: req.auth.role === "admin" ? "admin" : "customer",
      mensaje: req.body?.mensaje || req.body?.message
    });

    res.status(201).json({ message });
  })
);

messagesRouter.post(
  "/assistant",
  asyncHandler(async (req, res) => {
    if (req.auth.role === "admin") {
      res.status(403).json({ message: "Los asistentes responden a clientes. Usa el panel para contestar como soporte." });
      return;
    }

    const message = await createAssistantMessage({
      userId: req.auth.sub,
      botId: req.body?.botId || "taz",
      userText: req.body?.mensaje || req.body?.message
    });

    res.status(201).json({ message });
  })
);
