import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  capturePayPalOrder,
  confirmMercadoPagoPayment,
  confirmStripePaymentIntent,
  createMercadoPagoPreference,
  createPayPalOrder,
  createStripePaymentIntent,
  handleMercadoPagoWebhook,
  handlePayPalWebhook,
  handleStripeWebhook
} from "./service.js";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/stripe/payment-intent",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await createStripePaymentIntent(req.body?.orderId, req.auth);
    res.status(201).json(result);
  })
);

paymentsRouter.post(
  "/stripe/confirm",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await confirmStripePaymentIntent(req.body || {}, req.auth);
    res.json(result);
  })
);

paymentsRouter.post(
  "/paypal/order",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await createPayPalOrder(req.body?.orderId, req.auth);
    res.status(201).json(result);
  })
);

paymentsRouter.post(
  "/paypal/capture",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await capturePayPalOrder(req.body || {}, req.auth);
    res.json(result);
  })
);

paymentsRouter.post(
  "/mercadopago/preference",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await createMercadoPagoPreference(req.body?.orderId, req.auth);
    res.status(201).json(result);
  })
);

paymentsRouter.post(
  "/mercadopago/confirm",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await confirmMercadoPagoPayment(req.body || {}, req.auth);
    res.json(result);
  })
);

paymentsRouter.post(
  "/webhook/stripe",
  asyncHandler(async (req, res) => {
    const result = await handleStripeWebhook(req.body, req.headers["stripe-signature"]);
    res.json({ received: true, result });
  })
);

paymentsRouter.post(
  "/webhook/paypal",
  asyncHandler(async (req, res) => {
    const result = await handlePayPalWebhook(req.body || {});
    res.json({ received: true, result });
  })
);

paymentsRouter.post(
  "/webhook/mercadopago",
  asyncHandler(async (req, res) => {
    const result = await handleMercadoPagoWebhook(req.body || {});
    res.json({ received: true, result });
  })
);
