import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { getProductById, listProducts, recordProductView } from "./service.js";

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await listProducts({
      search: req.query.search,
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
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
