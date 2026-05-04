import {
  createMercadoPagoPreference,
  createPayPalRemoteOrder,
  createStripeCheckoutSession,
  capturePayPalRemoteOrder,
  fetchMercadoPagoPayment,
  fetchStripeCheckoutSession
} from "./_lib/payments.js";
import { empty, error, json, readJson } from "./_lib/response.js";
import { getBearerToken, hashPassword, signToken, verifyPassword, verifyToken } from "./_lib/security.js";
import {
  buildCheckoutSummary,
  clearCart,
  clearAllProducts,
  createOrderFromCart,
  createProduct,
  createUser,
  decrementStockForOrder,
  deleteProduct,
  ensureDatabase,
  getCartState,
  getOrderById,
  getOrderWithItems,
  getProductById,
  getUserByEmail,
  getUserById,
  getUserDashboard,
  listAdminProducts,
  listProducts,
  markOrderStatus,
  recordProductView,
  recordSearch,
  savePaymentRecord,
  serializeUser,
  setCartItem,
  updateProduct,
  updateUserAddress
} from "./_lib/store.js";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim().toLowerCase());
}

function normalizeAddress(value) {
  const address = value && typeof value === "object" ? value : {};

  return {
    calle: String(address.calle || "").trim(),
    ciudad: String(address.ciudad || "").trim(),
    estado: String(address.estado || "").trim(),
    cp: String(address.cp || "").trim(),
    pais: String(address.pais || "").trim()
  };
}

function getJwtSecret(env) {
  return String(env.JWT_SECRET || "marketzone-cloudflare-secret");
}

function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    throw httpError(403, "Solo el administrador puede hacer esto.");
  }
}

async function authenticate(request, env, db, required = true) {
  const token = getBearerToken(request);

  if (!token) {
    if (!required) {
      return null;
    }

    throw httpError(401, "Necesitas iniciar sesion.");
  }

  try {
    const payload = await verifyToken(token, getJwtSecret(env));
    const user = await getUserById(db, payload.sub);

    if (!user) {
      throw new Error("La sesion ya no existe.");
    }

    return user;
  } catch (authError) {
    if (!required) {
      return null;
    }

    throw httpError(401, authError.message || "No se pudo validar tu sesion.");
  }
}

async function buildAuthPayload(user, env) {
  const publicUser = serializeUser(user);
  const token = await signToken(
    {
      sub: publicUser.id,
      role: publicUser.role,
      email: publicUser.email,
      nombre: publicUser.nombre
    },
    getJwtSecret(env)
  );

  return {
    token,
    user: publicUser
  };
}

function mapMercadoPagoStatus(remoteStatus) {
  if (remoteStatus === "approved") {
    return "paid";
  }

  if (remoteStatus === "pending" || remoteStatus === "in_process") {
    return "pending_payment";
  }

  if (remoteStatus === "cancelled" || remoteStatus === "rejected") {
    return "cancelled";
  }

  return "pending_payment";
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return empty();
  }

  try {
    const db = await ensureDatabase(env);
    const url = new URL(request.url);
    const route = url.pathname.replace(/^\/api\/?/, "");
    const segments = route ? route.split("/").filter(Boolean) : [];
    const [first = "", second = "", third = ""] = segments;

    if (!segments.length || (first === "health" && request.method === "GET")) {
      return json({
        status: "ok",
        runtime: "cloudflare-pages-functions",
        timestamp: new Date().toISOString()
      });
    }

    if (first === "auth" && second === "register" && request.method === "POST") {
      const body = await readJson(request);
      const nombre = String(body.nombre || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!nombre || !validateEmail(email) || password.length < 6) {
        throw httpError(400, "Completa nombre, email valido y una contrasena de al menos 6 caracteres.");
      }

      const existing = await getUserByEmail(db, email);

      if (existing) {
        throw httpError(409, "Ese email ya esta registrado.");
      }

      const passwordHash = await hashPassword(password);
      const user = await createUser(db, { nombre, email, passwordHash });
      return json(await buildAuthPayload(user, env), 201);
    }

    if (first === "auth" && second === "login" && request.method === "POST") {
      const body = await readJson(request);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const user = await getUserByEmail(db, email);

      if (!user || !(await verifyPassword(password, user.password_hash))) {
        throw httpError(401, "Email o contrasena incorrectos.");
      }

      return json(await buildAuthPayload(user, env));
    }

    if (first === "auth" && second === "me" && request.method === "GET") {
      const user = await authenticate(request, env, db);
      return json({ user: serializeUser(user) });
    }

    if (first === "users" && second === "me" && request.method === "GET") {
      const user = await authenticate(request, env, db);
      return json(await getUserDashboard(db, user.id));
    }

    if (first === "users" && second === "me" && request.method === "PUT") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const direccion = normalizeAddress(body.direccion);
      const updated = await updateUserAddress(db, user.id, direccion);
      return json({ user: serializeUser(updated) });
    }

    if (first === "products" && request.method === "GET") {
      const user = await authenticate(request, env, db, false);
      const result = await listProducts(db, {
        search: url.searchParams.get("search") || "",
        category: url.searchParams.get("category") || "",
        minPrice: url.searchParams.get("minPrice") || "",
        maxPrice: url.searchParams.get("maxPrice") || "",
        limit: url.searchParams.get("limit") || "24"
      });

      if (user && url.searchParams.get("search")) {
        await recordSearch(db, user.id, url.searchParams.get("search"));
      }

      return json(result);
    }

    if (first === "cart" && !second && request.method === "GET") {
      const user = await authenticate(request, env, db);
      return json(await getCartState(db, user.id));
    }

    if (first === "cart" && second === "items" && !third && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const productId = Number(body.productId);
      const cantidad = Number(body.cantidad || 1);

      if (!Number.isFinite(productId) || !Number.isFinite(cantidad)) {
        throw httpError(400, "Producto o cantidad invalidos.");
      }

      const product = await getProductById(db, productId);

      if (!product) {
        throw httpError(404, "El producto ya no existe.");
      }

      if (cantidad < 1 || cantidad > product.stock) {
        throw httpError(400, "La cantidad solicitada no esta disponible.");
      }

      await setCartItem(db, user.id, productId, cantidad);
      await recordProductView(db, user.id, productId);
      return json(await getCartState(db, user.id), 201);
    }

    if (first === "cart" && second === "items" && third && request.method === "PATCH") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const productId = Number(third);
      const cantidad = Number(body.cantidad || 0);

      if (!Number.isFinite(productId) || !Number.isFinite(cantidad)) {
        throw httpError(400, "Producto o cantidad invalidos.");
      }

      const product = await getProductById(db, productId);

      if (!product) {
        throw httpError(404, "El producto ya no existe.");
      }

      if (cantidad > product.stock) {
        throw httpError(400, "La cantidad solicitada supera el stock disponible.");
      }

      await setCartItem(db, user.id, productId, cantidad);
      return json(await getCartState(db, user.id));
    }

    if (first === "cart" && second === "items" && third && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      await setCartItem(db, user.id, Number(third), 0);
      return json(await getCartState(db, user.id));
    }

    if (first === "checkout" && second === "summary" && request.method === "GET") {
      const user = await authenticate(request, env, db);
      return json(await buildCheckoutSummary(db, user.id));
    }

    if (first === "checkout" && second === "orders" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const direccion = normalizeAddress(body.direccion);
      const proveedorPago = String(body.proveedorPago || "").trim().toLowerCase();

      if (!direccion.calle || !direccion.ciudad || !direccion.estado || !direccion.cp || !direccion.pais) {
        throw httpError(400, "Completa toda la direccion antes de continuar.");
      }

      if (!["paypal", "mercadopago", "stripe"].includes(proveedorPago)) {
        throw httpError(400, "Selecciona un metodo de pago valido.");
      }

      return json(await createOrderFromCart(db, user.id, { direccion, proveedorPago }), 201);
    }

    if (first === "admin" && second === "products" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({
        items: await listAdminProducts(db)
      });
    }

    if (first === "admin" && second === "products" && !third && request.method === "POST") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      return json(
        {
          product: await createProduct(db, body)
        },
        201
      );
    }

    if (first === "admin" && second === "products" && !third && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      await clearAllProducts(db);
      return json({
        ok: true
      });
    }

    if (first === "admin" && second === "products" && third && request.method === "PUT") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      return json({
        product: await updateProduct(db, Number(third), body)
      });
    }

    if (first === "admin" && second === "products" && third && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      await deleteProduct(db, Number(third));
      return json({
        ok: true
      });
    }

    if (first === "payments" && second === "paypal" && third === "order" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const order = await getOrderWithItems(db, String(body.orderId || ""));

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "La orden no existe para este usuario.");
      }

      const remoteOrder = await createPayPalRemoteOrder(env, request, order);
      await savePaymentRecord(db, {
        orderId: order.id,
        provider: "paypal",
        status: "created",
        externalId: remoteOrder.externalId,
        approvalUrl: remoteOrder.approvalUrl,
        payload: JSON.stringify(remoteOrder.payload)
      });

      return json({
        approvalUrl: remoteOrder.approvalUrl,
        externalId: remoteOrder.externalId
      });
    }

    if (first === "payments" && second === "paypal" && third === "capture" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const orderId = String(body.orderId || "");
      const paypalOrderId = String(body.paypalOrderId || "");
      const order = await getOrderById(db, orderId);

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "La orden no existe para este usuario.");
      }

      const payload = await capturePayPalRemoteOrder(env, paypalOrderId);
      const completed = payload.status === "COMPLETED";

      await savePaymentRecord(db, {
        orderId,
        provider: "paypal",
        status: completed ? "paid" : "pending_payment",
        externalId: paypalOrderId,
        payload: JSON.stringify(payload)
      });
      await markOrderStatus(db, orderId, completed ? "paid" : "pending_payment", paypalOrderId);

      if (completed && order.estado !== "paid") {
        await decrementStockForOrder(db, orderId);
        await clearCart(db, user.id);
      }

      return json({
        status: completed ? "paid" : "pending_payment"
      });
    }

    if (first === "payments" && second === "mercadopago" && third === "preference" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const order = await getOrderWithItems(db, String(body.orderId || ""));

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "La orden no existe para este usuario.");
      }

      const preference = await createMercadoPagoPreference(env, request, order);
      await savePaymentRecord(db, {
        orderId: order.id,
        provider: "mercadopago",
        status: "created",
        externalId: preference.externalId,
        approvalUrl: preference.initPoint,
        payload: JSON.stringify(preference.payload)
      });

      return json({
        initPoint: preference.initPoint,
        externalId: preference.externalId
      });
    }

    if (first === "payments" && second === "mercadopago" && third === "confirm" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const orderId = String(body.orderId || "");
      const paymentId = String(body.paymentId || "");
      const order = await getOrderById(db, orderId);

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "La orden no existe para este usuario.");
      }

      const payload = await fetchMercadoPagoPayment(env, paymentId);
      const nextStatus = mapMercadoPagoStatus(payload.status);

      await savePaymentRecord(db, {
        orderId,
        provider: "mercadopago",
        status: nextStatus,
        externalId: paymentId,
        payload: JSON.stringify(payload)
      });
      await markOrderStatus(db, orderId, nextStatus, paymentId);

      if (nextStatus === "paid" && order.estado !== "paid") {
        await decrementStockForOrder(db, orderId);
        await clearCart(db, user.id);
      }

      return json({
        status: nextStatus
      });
    }

    if (first === "payments" && second === "stripe" && third === "session" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const order = await getOrderWithItems(db, String(body.orderId || ""));

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "La orden no existe para este usuario.");
      }

      const session = await createStripeCheckoutSession(env, request, order);
      await savePaymentRecord(db, {
        orderId: order.id,
        provider: "stripe",
        status: "created",
        externalId: session.externalId,
        approvalUrl: session.checkoutUrl,
        payload: JSON.stringify(session.payload)
      });

      return json({
        checkoutUrl: session.checkoutUrl,
        externalId: session.externalId
      });
    }

    if (first === "payments" && second === "stripe" && third === "confirm" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const orderId = String(body.orderId || "");
      const sessionId = String(body.sessionId || "");
      const order = await getOrderById(db, orderId);

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "La orden no existe para este usuario.");
      }

      const session = await fetchStripeCheckoutSession(env, sessionId);
      const isPaid = session.payment_status === "paid";

      await savePaymentRecord(db, {
        orderId,
        provider: "stripe",
        status: isPaid ? "paid" : "pending_payment",
        externalId: sessionId,
        payload: JSON.stringify(session)
      });
      await markOrderStatus(db, orderId, isPaid ? "paid" : "pending_payment", sessionId);

      if (isPaid && order.estado !== "paid") {
        await decrementStockForOrder(db, orderId);
        await clearCart(db, user.id);
      }

      return json({
        status: isPaid ? "paid" : "pending_payment"
      });
    }

    return error("Ruta no encontrada.", 404);
  } catch (requestError) {
    console.error("Cloudflare API error:", requestError);
    return error(requestError.message || "No se pudo completar la solicitud.", requestError.status || 500);
  }
}
