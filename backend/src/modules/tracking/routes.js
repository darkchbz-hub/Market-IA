import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { listSearches, saveSearch } from "./service.js";

export const trackingRouter = Router();

trackingRouter.use(authenticate);

trackingRouter.get(
  "/searches",
  asyncHandler(async (req, res) => {
    const items = await listSearches(req.auth.sub);
    res.json({ items });
  })
);

trackingRouter.post(
  "/searches",
  asyncHandler(async (req, res) => {
    const search = await saveSearch(req.auth.sub, req.body?.busqueda || req.body?.query);
    res.status(201).json({ search });
  })
);
