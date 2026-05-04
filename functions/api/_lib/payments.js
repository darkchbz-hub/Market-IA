function getPayPalBaseUrl(env) {
  return String(env.PAYPAL_ENV || "sandbox").toLowerCase() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getOrigin(request) {
  return new URL(request.url).origin;
}

function buildFormBody(entries) {
  const params = new URLSearchParams();

  for (const [key, value] of entries) {
    params.append(key, String(value));
  }

  return params;
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text || "{}");
  } catch {
    return { raw: text };
  }
}

async function getPayPalAccessToken(env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error("Configura PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en Cloudflare Pages.");
  }

  const response = await fetch(`${getPayPalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const payload = await readJsonResponse(response);

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.message || "No se pudo autenticar con PayPal.");
  }

  return payload.access_token;
}

function getStripeSecretKey(env) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Configura STRIPE_SECRET_KEY en Cloudflare Pages.");
  }

  return String(env.STRIPE_SECRET_KEY);
}

async function stripeRequest(env, path, body, method = "POST") {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey(env)}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || "No se pudo completar la operacion con Stripe.");
  }

  return payload;
}

export async function createPayPalRemoteOrder(env, request, order) {
  const accessToken = await getPayPalAccessToken(env);
  const origin = getOrigin(request);
  const response = await fetch(`${getPayPalBaseUrl(env)}/v2/checkout/orders`, {
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
          amount: {
            currency_code: "MXN",
            value: Number(order.total).toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "MarketZone",
            locale: "es-MX",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${origin}/pago-estado.html?provider=paypal&status=success&orderId=${encodeURIComponent(order.id)}`,
            cancel_url: `${origin}/pago-estado.html?provider=paypal&status=cancel&orderId=${encodeURIComponent(order.id)}`
          }
        }
      }
    })
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.message || payload.details?.[0]?.description || "No se pudo crear la orden de PayPal.");
  }

  const approvalLink = Array.isArray(payload.links) ? payload.links.find((item) => item.rel === "approve") : null;

  if (!approvalLink?.href) {
    throw new Error("PayPal no devolvio la URL de aprobacion.");
  }

  return {
    externalId: payload.id,
    approvalUrl: approvalLink.href,
    payload
  };
}

export async function capturePayPalRemoteOrder(env, paypalOrderId) {
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${getPayPalBaseUrl(env)}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.message || payload.details?.[0]?.description || "PayPal no pudo capturar el pago.");
  }

  return payload;
}

export async function createMercadoPagoPreference(env, request, order) {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("Configura MERCADOPAGO_ACCESS_TOKEN en Cloudflare Pages.");
  }

  const origin = getOrigin(request);
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: order.id,
      items: order.items.map((item) => ({
        id: String(item.productoId),
        title: item.nombre,
        quantity: item.cantidad,
        currency_id: "MXN",
        unit_price: Number(item.precio)
      })),
      back_urls: {
        success: `${origin}/pago-estado.html?provider=mercadopago&status=success&orderId=${encodeURIComponent(order.id)}`,
        pending: `${origin}/pago-estado.html?provider=mercadopago&status=pending&orderId=${encodeURIComponent(order.id)}`,
        failure: `${origin}/pago-estado.html?provider=mercadopago&status=cancel&orderId=${encodeURIComponent(order.id)}`
      },
      auto_return: "approved"
    })
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "No se pudo crear la preferencia de Mercado Pago.");
  }

  const initPoint = payload.init_point || payload.sandbox_init_point;

  if (!initPoint) {
    throw new Error("Mercado Pago no devolvio la URL de pago.");
  }

  return {
    externalId: String(payload.id || ""),
    initPoint,
    payload
  };
}

export async function fetchMercadoPagoPayment(env, paymentId) {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("Configura MERCADOPAGO_ACCESS_TOKEN en Cloudflare Pages.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`
    }
  });

  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "No se pudo validar el pago de Mercado Pago.");
  }

  return payload;
}

export async function createStripeCheckoutSession(env, request, order) {
  const origin = getOrigin(request);
  const body = buildFormBody([
    ["mode", "payment"],
    ["payment_method_types[0]", "card"],
    ["client_reference_id", order.id],
    ["metadata[orderId]", order.id],
    [
      "success_url",
      `${origin}/pago-estado.html?provider=stripe&status=success&orderId=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`
    ],
    ["cancel_url", `${origin}/pago-estado.html?provider=stripe&status=cancel&orderId=${encodeURIComponent(order.id)}`]
  ]);

  order.items.forEach((item, index) => {
    body.append(`line_items[${index}][quantity]`, String(item.cantidad));
    body.append(`line_items[${index}][price_data][currency]`, "mxn");
    body.append(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(item.precio) * 100)));
    body.append(`line_items[${index}][price_data][product_data][name]`, item.nombre);
  });

  const payload = await stripeRequest(env, "/v1/checkout/sessions", body, "POST");

  if (!payload.url) {
    throw new Error("Stripe no devolvio la URL de checkout.");
  }

  return {
    externalId: payload.id,
    checkoutUrl: payload.url,
    payload
  };
}

export async function fetchStripeCheckoutSession(env, sessionId) {
  return stripeRequest(env, `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, undefined, "GET");
}
