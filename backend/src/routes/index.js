import { Router } from "express";
import { adminRouter } from "../modules/admin/routes.js";
import { authRouter } from "../modules/auth/routes.js";
import { cartRouter } from "../modules/cart/routes.js";
import { checkoutRouter } from "../modules/checkout/routes.js";
import { messagesRouter } from "../modules/messages/routes.js";
import { paymentsRouter } from "../modules/payments/routes.js";
import { productsRouter } from "../modules/products/routes.js";
import { trackingRouter } from "../modules/tracking/routes.js";
import { usersRouter } from "../modules/users/routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/checkout", checkoutRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/messages", messagesRouter);
apiRouter.use("/tracking", trackingRouter);
apiRouter.use("/admin", adminRouter);
