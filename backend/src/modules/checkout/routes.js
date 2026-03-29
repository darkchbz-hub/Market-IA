import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { createOrderFromCart, getCheckoutSummary, getOrderById, listOrdersByUser } from "./service.js";

export const checkoutRouter = Router();

checkoutRouter.use(authenticate);

checkoutRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await getCheckoutSummary(req.auth.sub);
    res.json(summary);
  })
);

checkoutRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const items = await listOrdersByUser(req.auth.sub);
    res.json({ items });
  })
);

checkoutRouter.get(
  "/orders/:orderId",
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.params.orderId, req.auth.role === "admin" ? null : req.auth.sub);
    res.json({ order });
  })
);

checkoutRouter.post(
  "/orders",
  asyncHandler(async (req, res) => {
    const order = await createOrderFromCart(req.auth.sub, req.body || {});
    res.status(201).json({ order });
  })
);
