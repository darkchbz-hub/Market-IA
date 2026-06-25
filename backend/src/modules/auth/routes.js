import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { getCurrentUserProfile, loginUser, recoverAdminAccount, registerUser, requestPasswordReset, resetPassword } from "./service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body || {});
    res.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = await loginUser(req.body || {});
    res.json(result);
  })
);

authRouter.post(
  "/admin/recover",
  asyncHandler(async (req, res) => {
    const result = await recoverAdminAccount(req.body || {});
    res.json(result);
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const result = await requestPasswordReset(req.body?.email);
    res.json(result);
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const result = await resetPassword(req.body || {});
    res.json(result);
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getCurrentUserProfile(req.auth.sub);
    res.json({ user });
  })
);
