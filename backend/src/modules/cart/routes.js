import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { getCart, removeCartItem, upsertCartItem } from "./service.js";

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.auth.sub);
    res.json(cart);
  })
);

cartRouter.post(
  "/items",
  asyncHandler(async (req, res) => {
    const cart = await upsertCartItem(req.auth.sub, req.body || {});
    res.status(201).json(cart);
  })
);

cartRouter.patch(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const cart = await upsertCartItem(req.auth.sub, {
      productId: req.params.productId,
      cantidad: req.body?.cantidad
    });

    res.json(cart);
  })
);

cartRouter.delete(
  "/items/:productId",
  asyncHandler(async (req, res) => {
    const cart = await removeCartItem(req.auth.sub, req.params.productId);
    res.json(cart);
  })
);
