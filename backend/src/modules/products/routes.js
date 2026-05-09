import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  addProductQuestion,
  addProductReview,
  getHomepageData,
  getProductById,
  listCategories,
  listProducts,
  recordProductView
} from "./service.js";

export const productsRouter = Router();

productsRouter.get(
  "/home",
  asyncHandler(async (_req, res) => {
    const data = await getHomepageData();
    res.json(data);
  })
);

productsRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const items = await listCategories();
    res.json({ items });
  })
);

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await listProducts({
      search: req.query.search,
      category: req.query.category,
      brand: req.query.brand,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      rating: req.query.rating,
      availability: req.query.availability,
      sort: req.query.sort,
      page: req.query.page,
      limit: req.query.limit
    });

    res.json(products);
  })
);

productsRouter.get(
  "/:productId",
  asyncHandler(async (req, res) => {
    const product = await getProductById(req.params.productId);
    res.json({ product });
  })
);

productsRouter.post(
  "/:productId/view",
  authenticate,
  asyncHandler(async (req, res) => {
    await recordProductView(req.auth.sub, req.params.productId);
    res.status(201).json({ ok: true });
  })
);

productsRouter.post(
  "/:productId/questions",
  authenticate,
  asyncHandler(async (req, res) => {
    const question = await addProductQuestion(req.params.productId, req.auth.sub, req.body || {});
    res.status(201).json({ question });
  })
);

productsRouter.post(
  "/:productId/reviews",
  authenticate,
  asyncHandler(async (req, res) => {
    const review = await addProductReview(req.params.productId, req.auth.sub, req.body || {});
    res.status(201).json({ review });
  })
);
