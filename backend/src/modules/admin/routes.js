import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { archiveProduct, createProduct, updateProduct } from "../products/service.js";
import { getAdminAnalytics, getAdminSummary, listAdminOrders, listAdminUsers } from "./service.js";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRole("admin"));

adminRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const summary = await getAdminSummary();
    res.json(summary);
  })
);

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const items = await listAdminUsers();
    res.json({ items });
  })
);

adminRouter.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const items = await listAdminOrders();
    res.json({ items });
  })
);

adminRouter.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const analytics = await getAdminAnalytics();
    res.json(analytics);
  })
);

adminRouter.post(
  "/products",
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.body || {});
    res.status(201).json({ product });
  })
);

adminRouter.patch(
  "/products/:productId",
  asyncHandler(async (req, res) => {
    const product = await updateProduct(req.params.productId, req.body || {});
    res.json({ product });
  })
);

adminRouter.delete(
  "/products/:productId",
  asyncHandler(async (req, res) => {
    const product = await archiveProduct(req.params.productId);
    res.json({ product });
  })
);
