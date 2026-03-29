import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { getUserDashboard, updateCurrentUser } from "./service.js";

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
