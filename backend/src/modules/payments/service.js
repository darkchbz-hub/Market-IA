import Stripe from "stripe";
import { env } from "../../config/env.js";
import { query } from "../../db/pool.js";
import { HttpError } from "../../shared/http-error.js";

function centsToDecimal(amountCents) {
  return (Number(amountCents) / 100).toFixed(2);
}

function buildClientPageUrl(page, params = {}) {
  const baseUrl = env.clientUrl.endsWith("/") ? env.clientUrl : `${env.clientUrl}/`;
  const url = new URL(page, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function paypalBaseUrl() {
  return env.paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function mapOrderStatus(paymentStatus) {
  const normalized = String(paymentStatus || "").toLowerCase();

  if (["succeeded", "approved", "completed", "paid", "approved"].includes(normalized)) {
    return "paid";
  }

  if (["pending", "in_process", "requires_payment_method", "requires_confirmation", "processing", "created"].includes(normalized)) {
    return "awaiting_payment";
  }

  if (["rejected", "failed", "canceled", "cancelled", "denied", "voided", "expired"].includes(normalized)) {
    return "payment_failed";
  }

  return "awaiting_payment";
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function getOrderForPayment(orderId, auth) {
  if (!orderId) {
    throw new HttpError(400, "Debes indicar la orden a pagar.");
  }

  const values = [orderId];
  const conditions = ["o.id = $1"];

  if (auth && auth.role !== "admin") {
    values.push(auth.sub);
    conditions.push(`o.user_id = $${values.length}`);
  }

  const { rows } = await query(
    `
      SELECT
        o.*,
        u.nombre,
        u.email
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      WHERE ${conditions.join(" AND ")}
    `,
    values
  );

  if (!rows[0]) {
    throw new HttpError(404, "Orden no encontrada.");
  }

  const itemsResult = await query(
    `
      SELECT nombre_producto, cantidad, precio_cents
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
    `,
    [orderId]
  );

  return {
    ...rows[0],
    items: itemsResult.rows
  };
}

async function getOrderAmount(orderId) {
  const { rows } = await query(
    `
      SELECT total_cents
      FROM orders
      WHERE id = $1
    `,
    [orderId]
  );

  if (!rows[0]) {
    throw new HttpError(404, "Orden no encontrada.");
  }

  return Number(rows[0].total_cents);
}

async function upsertPaymentRecord({ orderId, provider, providerPaymentId, amountCents, status, rawResponse }) {
  await query(
    `
      INSERT INTO payments (order_id, provider, provider_payment_id, amount_cents, status, raw_response)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT (order_id)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        provider_payment_id = EXCLUDED.provider_payment_id,
        amount_cents = EXCLUDED.amount_cents,
        status = EXCLUDED.status,
        raw_response = EXCLUDED.raw_response,
        updated_at = NOW()
    `,
    [orderId, provider, providerPaymentId || null, Number(amountCents || 0), status, JSON.stringify(rawResponse || {})]
  );
}

async function syncOrderPayment({ provider, orderId, providerPaymentId, status, rawResponse }) {
  const amountCents = await getOrderAmount(orderId);
  const orderStatus = mapOrderStatus(status);

  await upsertPaymentRecord({
    orderId,
    provider,
    providerPaymentId,
    amountCents,
    status,
    rawResponse
  });

  await query(
    `
      UPDATE orders
      SET
        payment_provider = $2,
        payment_reference = $3,
        estado = $4,
        updated_at = NOW()
      WHERE id = $1
    `,
    [orderId, provider, providerPaymentId || null, orderStatus]
  );

  return {
    orderId,
    provider,
    providerPaymentId,
    paymentStatus: status,
    orderStatus
  };
}

async function getPayPalAccessToken() {
  if (!env.paypalClientId || !env.paypalClientSecret) {
    throw new HttpError(500, "Faltan credenciales de PayPal.");
  }

  const basicToken = Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(502, "No se pudo autenticar con PayPal.", payload);
  }

  return payload.access_token;
}

export async function createStripePaymentIntent(orderId, auth) {
  if (!env.stripeSecretKey) {
    throw new HttpError(500, "Falta la llave secreta de Stripe.");
  }

  const order = await getOrderForPayment(orderId, auth);
  const stripe = new Stripe(env.stripeSecretKey);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(order.total_cents),
    currency: String(order.moneda || "MXN").toLowerCase(),
    metadata: {
      orderId: order.id,
      userId: order.user_id
    },
    automatic_payment_methods: {
      enabled: true
    }
  });

  await syncOrderPayment({
    provider: "stripe",
    orderId: order.id,
    providerPaymentId: paymentIntent.id,
    status: paymentIntent.status,
    rawResponse: paymentIntent
  });

  return {
    proveedor: "stripe",
    orderId: order.id,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status
  };
}

export async function confirmStripePaymentIntent({ orderId, paymentIntentId }, auth) {
  if (!env.stripeSecretKey) {
    throw new HttpError(500, "Falta la llave secreta de Stripe.");
  }

  await getOrderForPayment(orderId, auth);

  if (!paymentIntentId) {
    throw new HttpError(400, "Debes indicar el PaymentIntent.");
  }

  const stripe = new Stripe(env.stripeSecretKey);
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return syncOrderPayment({
    provider: "stripe",
    orderId,
    providerPaymentId: paymentIntent.id,
    status: paymentIntent.status,
    rawResponse: paymentIntent
  });
}

export async function createPayPalOrder(orderId, auth) {
  const order = await getOrderForPayment(orderId, auth);
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          invoice_id: order.id,
          amount: {
            currency_code: order.moneda,
            value: centsToDecimal(order.total_cents)
          }
        }
      ],
      application_context: {
        brand_name: "MarketZone",
        user_action: "PAY_NOW",
        return_url: buildClientPageUrl("pago-estado.html", {
          status: "success",
          provider: "paypal",
          orderId: order.id
        }),
        cancel_url: buildClientPageUrl("pago-estado.html", {
          status: "cancel",
          provider: "paypal",
          orderId: order.id
        })
      }
    })
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(502, "PayPal no pudo crear la orden.", payload);
  }

  await syncOrderPayment({
    provider: "paypal",
    orderId: order.id,
    providerPaymentId: payload.id,
    status: payload.status || "CREATED",
    rawResponse: payload
  });

  return {
    proveedor: "paypal",
    orderId: order.id,
    paypalOrderId: payload.id,
    approvalUrl: payload.links?.find((link) => link.rel === "approve")?.href || null,
    status: payload.status
  };
}

export async function capturePayPalOrder({ orderId, paypalOrderId }, auth) {
  await getOrderForPayment(orderId, auth);

  if (!paypalOrderId) {
    throw new HttpError(400, "Debes indicar la orden de PayPal.");
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(502, "PayPal no pudo capturar el pago.", payload);
  }

  return syncOrderPayment({
    provider: "paypal",
    orderId,
    providerPaymentId: payload.id || paypalOrderId,
    status: payload.status || "COMPLETED",
    rawResponse: payload
  });
}

export async function createMercadoPagoPreference(orderId, auth) {
  if (!env.mercadopagoAccessToken) {
    throw new HttpError(500, "Falta el access token de Mercado Pago.");
  }

  const order = await getOrderForPayment(orderId, auth);
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mercadopagoAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: order.id,
      notification_url: `${env.serverUrl}/api/payments/webhook/mercadopago`,
      back_urls: {
        success: buildClientPageUrl("pago-estado.html", {
          status: "success",
          provider: "mercadopago",
          orderId: order.id
        }),
        failure: buildClientPageUrl("pago-estado.html", {
          status: "cancel",
          provider: "mercadopago",
          orderId: order.id
        }),
        pending: buildClientPageUrl("pago-estado.html", {
          status: "pending",
          provider: "mercadopago",
          orderId: order.id
        })
      },
      items: order.items.map((item) => ({
        title: item.nombre_producto,
        quantity: Number(item.cantidad),
        currency_id: order.moneda,
        unit_price: Number(item.precio_cents) / 100
      })),
      payer: {
        email: order.email,
        name: order.nombre
      },
      metadata: {
        orderId: order.id,
        userId: order.user_id
      }
    })
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(502, "Mercado Pago no pudo crear la preferencia.", payload);
  }

  await syncOrderPayment({
    provider: "mercadopago",
    orderId: order.id,
    providerPaymentId: payload.id,
    status: "pending",
    rawResponse: payload
  });

  return {
    proveedor: "mercadopago",
    orderId: order.id,
    preferenceId: payload.id,
    initPoint: payload.init_point || payload.sandbox_init_point || null
  };
}

export async function confirmMercadoPagoPayment({ orderId, paymentId }, auth) {
  await getOrderForPayment(orderId, auth);

  if (!env.mercadopagoAccessToken) {
    throw new HttpError(500, "Falta el access token de Mercado Pago.");
  }

  if (!paymentId) {
    throw new HttpError(400, "Debes indicar el pago de Mercado Pago.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.mercadopagoAccessToken}`
    }
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(502, "No se pudo consultar el pago en Mercado Pago.", payload);
  }

  return syncOrderPayment({
    provider: "mercadopago",
    orderId: payload.external_reference || orderId,
    providerPaymentId: String(payload.id || paymentId),
    status: payload.status || "pending",
    rawResponse: payload
  });
}

export async function handleStripeWebhook(rawBody, signature) {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    throw new HttpError(500, "Faltan las credenciales de Stripe webhook.");
  }

  const stripe = new Stripe(env.stripeSecretKey);
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  const object = event.data?.object;

  if (!object?.metadata?.orderId) {
    return { received: true, ignored: true };
  }

  return syncOrderPayment({
    provider: "stripe",
    orderId: object.metadata.orderId,
    providerPaymentId: object.id,
    status: object.status || event.type,
    rawResponse: object
  });
}

export async function handlePayPalWebhook(payload) {
  const resource = payload.resource || {};
  const orderId =
    resource.invoice_id ||
    resource.custom_id ||
    resource.supplementary_data?.related_ids?.order_id ||
    payload.orderId;

  if (!orderId) {
    return { received: true, ignored: true };
  }

  return syncOrderPayment({
    provider: "paypal",
    orderId,
    providerPaymentId: resource.id || payload.id || null,
    status: resource.status || payload.event_type || "pending",
    rawResponse: payload
  });
}

export async function handleMercadoPagoWebhook(payload) {
  if (!env.mercadopagoAccessToken) {
    throw new HttpError(500, "Falta el access token de Mercado Pago.");
  }

  const paymentId = payload.data?.id || payload.id;

  if (!paymentId) {
    return { received: true, ignored: true };
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.mercadopagoAccessToken}`
    }
  });

  const payment = await parseResponse(response);

  if (!response.ok) {
    throw new HttpError(502, "No se pudo validar la notificacion de Mercado Pago.", payment);
  }

  if (!payment.external_reference) {
    return { received: true, ignored: true };
  }

  return syncOrderPayment({
    provider: "mercadopago",
    orderId: payment.external_reference,
    providerPaymentId: String(payment.id),
    status: payment.status || "pending",
    rawResponse: payment
  });
}
