import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { addFavorite, cancelOwnOrder, getUserDashboard, removeFavorite, updateCurrentUser } from "./service.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const dashboard = await getUserDashboard(req.auth.sub);
    res.json(dashboard);
  })
);

usersRouter.put(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await updateCurrentUser(req.auth.sub, req.body || {});
    res.json({ user });
  })
);

usersRouter.post(
  "/me/favorites/:productId",
  asyncHandler(async (req, res) => {
    const result = await addFavorite(req.auth.sub, req.params.productId);
    res.status(201).json(result);
  })
);

usersRouter.delete(
  "/me/favorites/:productId",
  asyncHandler(async (req, res) => {
    const result = await removeFavorite(req.auth.sub, req.params.productId);
    res.json(result);
  })
);

usersRouter.post(
  "/me/orders/:orderId/cancel",
  asyncHandler(async (req, res) => {
    const result = await cancelOwnOrder(req.auth.sub, req.params.orderId);
    res.json(result);
  })
);
