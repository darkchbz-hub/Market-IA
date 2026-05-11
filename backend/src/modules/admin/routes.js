import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/require-role.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { archiveProduct, createProduct, updateProduct } from "../products/service.js";
import {
  createAdminCategory,
  deleteAdminCategory,
  deleteAdminUser,
  deleteAdminMedia,
  deleteAdminReview,
  getAdminContent,
  getAdminSummary,
  getAdminUserDetail,
  listAdminAnalytics,
  listAdminCategories,
  listAdminOrders,
  listAdminProducts,
  listAdminReviews,
  listAdminUsers,
  saveAdminBanner,
  saveAdminMusic,
  saveAdminSetting,
  saveAdminVideo,
  updateAdminCategory,
  updateAdminOrder
} from "./service.js";

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
  asyncHandler(async (req, res) => {
    const items = await listAdminUsers(req.query.search);
    res.json({ items });
  })
);

adminRouter.get(
  "/users/:userId",
  asyncHandler(async (req, res) => {
    const detail = await getAdminUserDetail(req.params.userId);
    res.json(detail);
  })
);

adminRouter.delete(
  "/users/:userId",
  asyncHandler(async (req, res) => {
    const result = await deleteAdminUser(req.auth.sub, req.params.userId);
    res.json(result);
  })
);

adminRouter.post(
  "/users/:userId/delete",
  asyncHandler(async (req, res) => {
    const result = await deleteAdminUser(req.auth.sub, req.params.userId);
    res.json(result);
  })
);

adminRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const items = await listAdminOrders({
      search: req.query.search,
      estado: req.query.estado
    });
    res.json({ items });
  })
);

adminRouter.patch(
  "/orders/:orderId",
  asyncHandler(async (req, res) => {
    const result = await updateAdminOrder(req.auth.sub, req.params.orderId, req.body || {});
    res.json(result);
  })
);

adminRouter.get(
  "/analytics",
  asyncHandler(async (_req, res) => {
    const analytics = await listAdminAnalytics();
    res.json(analytics);
  })
);

adminRouter.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const items = await listAdminProducts();
    res.json({ items });
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

adminRouter.get(
  "/reviews",
  asyncHandler(async (_req, res) => {
    const items = await listAdminReviews();
    res.json({ items });
  })
);

adminRouter.delete(
  "/reviews/:reviewId",
  asyncHandler(async (req, res) => {
    const result = await deleteAdminReview(req.auth.sub, req.params.reviewId);
    res.json(result);
  })
);

adminRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const items = await listAdminCategories();
    res.json({ items });
  })
);

adminRouter.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const category = await createAdminCategory(req.auth.sub, req.body || {});
    res.status(201).json({ category });
  })
);

adminRouter.patch(
  "/categories/:categoryId",
  asyncHandler(async (req, res) => {
    const category = await updateAdminCategory(req.auth.sub, req.params.categoryId, req.body || {});
    res.json({ category });
  })
);

adminRouter.delete(
  "/categories/:categoryId",
  asyncHandler(async (req, res) => {
    const result = await deleteAdminCategory(req.auth.sub, req.params.categoryId);
    res.json(result);
  })
);

adminRouter.get(
  "/content",
  asyncHandler(async (_req, res) => {
    const content = await getAdminContent();
    res.json(content);
  })
);

adminRouter.put(
  "/content/:scope",
  asyncHandler(async (req, res) => {
    const result = await saveAdminSetting(req.auth.sub, req.params.scope, req.body || {});
    res.json(result);
  })
);

adminRouter.post(
  "/banners",
  asyncHandler(async (req, res) => {
    const result = await saveAdminBanner(req.auth.sub, req.body || {});
    res.status(201).json(result);
  })
);

adminRouter.patch(
  "/banners/:bannerId",
  asyncHandler(async (req, res) => {
    const result = await saveAdminBanner(req.auth.sub, req.body || {}, req.params.bannerId);
    res.json(result);
  })
);

adminRouter.post(
  "/videos",
  asyncHandler(async (req, res) => {
    const result = await saveAdminVideo(req.auth.sub, req.body || {});
    res.status(201).json(result);
  })
);

adminRouter.patch(
  "/videos/:videoId",
  asyncHandler(async (req, res) => {
    const result = await saveAdminVideo(req.auth.sub, req.body || {}, req.params.videoId);
    res.json(result);
  })
);

adminRouter.post(
  "/music",
  asyncHandler(async (req, res) => {
    const result = await saveAdminMusic(req.auth.sub, req.body || {});
    res.status(201).json(result);
  })
);

adminRouter.patch(
  "/music/:musicId",
  asyncHandler(async (req, res) => {
    const result = await saveAdminMusic(req.auth.sub, req.body || {}, req.params.musicId);
    res.json(result);
  })
);

adminRouter.delete(
  "/media/:type/:id",
  asyncHandler(async (req, res) => {
    const result = await deleteAdminMedia(req.auth.sub, req.params.type, req.params.id);
    res.json(result);
  })
);
