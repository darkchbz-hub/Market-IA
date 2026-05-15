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
  canUserCommentOnProduct,
  clearCart,
  clearAllProducts,
  createOrderFromCart,
  createProductComment,
  createProduct,
  createUser,
  deleteOrder,
  decrementStockForOrder,
  deleteProductComment,
  deleteProduct,
  ensureDatabase,
  getAdminUserDetail,
  getCartState,
  getOrderById,
  getOrderWithItems,
  getProductById,
  getSiteContent,
  getUserByEmail,
  getUserById,
  getUserDashboard,
  isNicknameAvailable,
  listAdminUsers,
  listAdminProducts,
  listAdminCarts,
  listAdminOrders,
  listProductComments,
  listProducts,
  marketplaceCategories,
  markOrderStatus,
  recordProductView,
  recordSearch,
  savePaymentRecord,
  serializeUser,
  setCartItem,
  setUserActiveStatus,
  updateSiteContent,
  updateOrderItemStatus,
  updateOrderStatus,
  updateOrderTracking,
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

function normalizeEmailDomains(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
  }

  return String(input || "")
    .split(/[,\s\r\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
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

function normalizeGeoMeta(value) {
  const meta = value && typeof value === "object" ? value : {};

  return {
    latitude: Number(meta.latitude || 0),
    longitude: Number(meta.longitude || 0),
    timezone: String(meta.timezone || "").trim(),
    capturedAt: String(meta.capturedAt || "").trim()
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
    if (Number(user.is_active ?? 1) !== 1) {
      throw new Error("Tu cuenta ha sido desactivada, contacta a soporte.");
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

function buildCategoryItems() {
  return marketplaceCategories.map((item, index) => ({
    id: index + 1,
    ...item
  }));
}

function sanitizePublicGeneral(general) {
  const safeGeneral = { ...(general || {}) };
  const rawLogo = String(safeGeneral.logoUrl || "");

  // Avoid sending huge base64 images in public payloads (can hit Worker limits).
  if (rawLogo.startsWith("data:image/") && rawLogo.length > 12000) {
    safeGeneral.logoUrl = "";
  }

  return safeGeneral;
}

async function buildHomePayload(db) {
  const siteContent = await getSiteContent(db);
  const [featured, offers, bestsellers] = await Promise.all([
    listProducts(db, { limit: 8 }),
    listProducts(db, { limit: 8 }),
    listProducts(db, { limit: 8 })
  ]);

  const products = featured.items || [];

  return {
    settings: siteContent.home || {},
    general: sanitizePublicGeneral(siteContent.general),
    categories: buildCategoryItems(),
    banners: Array.isArray(siteContent.banners) && siteContent.banners.length
      ? siteContent.banners
      : [
          {
            id: "banner-1",
            titulo: "Marketplace premium para categorias modernas",
            subtitulo: "Tecnologia, hogar, mayoreo y mas en una sola tienda.",
            mediaUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
            linkUrl: "/catalogo"
          }
        ],
    videos: Array.isArray(siteContent.videos) ? siteContent.videos : [],
    music: Array.isArray(siteContent.music) ? siteContent.music : [],
    featuredProducts: products.slice(0, 8),
    offerProducts: [...products]
      .filter((item) => item.descuentoActivo || Number(item.precioOriginal || 0) > Number(item.precio || 0))
      .slice(0, 8),
    bestsellerProducts: products.slice(0, 8),
    partnerLogos: Array.isArray(siteContent.general?.partnerLogos) ? siteContent.general.partnerLogos : []
  };
}

async function listAdminReviewItems(db) {
  const result = await db
    .prepare(
      `
      SELECT pc.*, p.nombre AS producto_nombre, u.nombre, u.nickname
      FROM product_comments pc
      INNER JOIN products p ON p.id = pc.product_id
      INNER JOIN users u ON u.id = pc.user_id
      ORDER BY pc.created_at DESC
      LIMIT 100
    `
    )
    .all();

  return (result.results || []).map((row) => ({
    id: Number(row.id),
    productoId: Number(row.product_id),
    productoNombre: row.producto_nombre,
    usuarioNombre: row.nombre,
    nickname: row.nickname || "",
    rating: Number(row.rating || 0),
    comentario: row.comentario,
    fecha: row.created_at
  }));
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
      const telefono = String(body.telefono || "").trim();
      const nickname = String(body.nickname || "").trim();
      const direccion = normalizeAddress(body.direccion);
      const avatarUrl = String(body.avatarUrl || "").trim();
      const geoMeta = normalizeGeoMeta(body.geoMeta);
      const invitationCode = String(body.invitationCode || "").trim();
      const siteContent = await getSiteContent(db);
      const configuredInviteCode = String(siteContent?.general?.signupInviteCode || "").trim();
      const allowedDomains = normalizeEmailDomains(siteContent?.general?.allowedEmailDomains);
      const emailDomain = email.split("@")[1] || "";

      if (!nombre || !validateEmail(email) || password.length < 6) {
        throw httpError(400, "Completa nombre, email valido y una contrasena de al menos 6 caracteres.");
      }
      if (!/^\d{6}$/.test(invitationCode)) {
        throw httpError(400, "Ingresa el codigo de invitacion de 6 digitos.");
      }
      if (configuredInviteCode && invitationCode !== configuredInviteCode) {
        throw httpError(400, "El codigo de invitacion no es valido.");
      }
      if (allowedDomains.length && !allowedDomains.includes(String(emailDomain).toLowerCase())) {
        throw httpError(400, "Este dominio de correo no esta permitido para registro.");
      }

      if (!telefono || !direccion.calle || !direccion.ciudad || !direccion.estado || !direccion.cp || !direccion.pais) {
        throw httpError(400, "Completa todos los datos obligatorios para crear tu cuenta.");
      }

      const existing = await getUserByEmail(db, email);

      if (existing) {
        throw httpError(409, "Ese email ya esta registrado.");
      }

      const passwordHash = await hashPassword(password);
      const user = await createUser(db, { nombre, email, passwordHash, telefono, nickname, avatarUrl, direccion, geoMeta });
      return json(await buildAuthPayload(user, env), 201);
    }

    if (first === "auth" && second === "nickname-available" && request.method === "GET") {
      const nickname = String(url.searchParams.get("nickname") || "").trim();
      return json({
        available: nickname ? await isNicknameAvailable(db, nickname) : false
      });
    }

    if (first === "auth" && second === "login" && request.method === "POST") {
      const body = await readJson(request);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const user = await getUserByEmail(db, email);

      if (!user || !(await verifyPassword(password, user.password_hash))) {
        throw httpError(401, "Email o contrasena incorrectos.");
      }
      if (Number(user.is_active ?? 1) !== 1) {
        throw httpError(403, "Tu cuenta ha sido desactivada, contacta a soporte.");
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
      const updated = await updateUserAddress(db, user.id, direccion, body.telefono, {
        nickname: body.nickname,
        avatarUrl: body.avatarUrl,
        geoMeta: normalizeGeoMeta(body.geoMeta)
      });
      return json({ user: serializeUser(updated) });
    }

    if (first === "users" && second === "me" && third === "favorites" && request.method === "POST") {
      await authenticate(request, env, db);
      return json({ ok: true }, 201);
    }

    if (first === "users" && second === "me" && third === "favorites" && request.method === "DELETE") {
      await authenticate(request, env, db);
      return json({ ok: true });
    }

    if (first === "users" && second === "me" && third === "orders" && segments[3] && segments[4] === "cancel" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const orderId = String(segments[3] || "").trim();
      const order = await getOrderById(db, orderId);

      if (!order || Number(order.user_id) !== Number(user.id)) {
        throw httpError(404, "Pedido no encontrado.");
      }

      if (!["pending_payment", "paid"].includes(String(order.estado || ""))) {
        throw httpError(400, "Este pedido ya no se puede cancelar.");
      }

      return json(await updateOrderStatus(db, orderId, "cancelled"));
    }

    if (first === "auth" && second === "forgot-password" && request.method === "POST") {
      return json({
        ok: true,
        message: "Recuperacion preparada. Integra correo real cuando actives el proveedor."
      });
    }

    if (first === "products" && second === "home" && request.method === "GET") {
      return json(await buildHomePayload(db));
    }

    if (first === "products" && second === "categories" && request.method === "GET") {
      return json({
        items: buildCategoryItems()
      });
    }

    if (first === "products" && !second && request.method === "GET") {
      const user = await authenticate(request, env, db, false);
      const result = await listProducts(db, {
        search: url.searchParams.get("search") || "",
        category: url.searchParams.get("category") || "",
        brand: url.searchParams.get("brand") || "",
        minPrice: url.searchParams.get("minPrice") || "",
        maxPrice: url.searchParams.get("maxPrice") || "",
        limit: url.searchParams.get("limit") || "24"
      });

      if (user && url.searchParams.get("search")) {
        await recordSearch(db, user.id, url.searchParams.get("search"));
      }

      return json({
        ...result,
        filters: {
          brands: []
        }
      });
    }

    if (first === "products" && second && !third && request.method === "GET") {
      const user = await authenticate(request, env, db, false);
      const product = await getProductById(db, second);

      if (!product) {
        throw httpError(404, "El producto no existe.");
      }

      if (user) {
        await recordProductView(db, user.id, product.id);
      }

      const relatedPayload = await listProducts(db, {
        category: product.categoria,
        limit: 6
      });
      const comments = await listProductComments(db, product.id);
      const relatedProducts = (relatedPayload.items || []).filter((item) => Number(item.id) !== Number(product.id)).slice(0, 4);

      return json({
        product,
        comments,
        canComment: user ? await canUserCommentOnProduct(db, user.id, product.id) : false,
        relatedProducts,
        questions: []
      });
    }

    if (first === "products" && second && third === "reviews" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const product = await getProductById(db, second);

      if (!product) {
        throw httpError(404, "El producto no existe.");
      }

      const body = await readJson(request);
      return json(
        {
          comments: await createProductComment(db, user.id, product.id, body)
        },
        201
      );
    }

    if (first === "products" && second && third === "questions" && request.method === "POST") {
      await authenticate(request, env, db);
      return json({
        ok: true,
        message: "La seccion de preguntas queda lista para integrarse en una siguiente fase."
      }, 201);
    }

    if (first === "products" && second && third === "view" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const product = await getProductById(db, second);

      if (!product) {
        throw httpError(404, "El producto no existe.");
      }

      await recordProductView(db, user.id, product.id);
      return json({ ok: true });
    }

    if (first === "products" && second && third === "comments" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const product = await getProductById(db, second);

      if (!product) {
        throw httpError(404, "El producto no existe.");
      }

      const body = await readJson(request);
      return json({
        comments: await createProductComment(db, user.id, product.id, body)
      }, 201);
    }

    if (first === "site-content" && request.method === "GET") {
      return json(await getSiteContent(db));
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

      await setCartItem(db, user.id, productId, cantidad, { increment: true });
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
      const telefono = String(body.telefono || "").trim();

      if (!direccion.calle || !direccion.ciudad || !direccion.estado || !direccion.cp || !direccion.pais) {
        throw httpError(400, "Completa toda la direccion antes de continuar.");
      }

      if (!["paypal", "mercadopago", "stripe"].includes(proveedorPago)) {
        throw httpError(400, "Selecciona un metodo de pago valido.");
      }

      return json(await createOrderFromCart(db, user.id, { direccion, proveedorPago, telefono }), 201);
    }

    if (first === "admin" && second === "products" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({
        items: await listAdminProducts(db)
      });
    }

    if (first === "admin" && second === "products" && third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const product = await getProductById(db, third);

      if (!product) {
        throw httpError(404, "El producto no existe.");
      }

      return json({ product });
    }

    if (first === "admin" && second === "summary" && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const [usersPayload, productsPayload, ordersPayload, reviewsPayload] = await Promise.all([
        listAdminUsers(db),
        listAdminProducts(db),
        listAdminOrders(db),
        listAdminReviewItems(db)
      ]);

      return json({
        usuarios: usersPayload.length,
        productosActivos: productsPayload.length,
        ordenes: ordersPayload.length,
        ordenesPendientes: ordersPayload.filter((item) => item.estado === "pending_payment").length,
        ordenesEntregadas: ordersPayload.filter((item) => item.estado === "paid").length,
        ingresos: ordersPayload.reduce((sum, item) => sum + Number(item.total || 0), 0),
        resenasVisibles: reviewsPayload.length,
        actividadReciente: []
      });
    }

    if (first === "admin" && second === "orders" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({
        items: await listAdminOrders(db)
      });
    }

    if (first === "admin" && second === "users" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const search = String(url.searchParams.get("search") || "").trim().toLowerCase();
      const users = await listAdminUsers(db);
      return json({
        items: search
          ? users.filter((item) =>
              [item.nombre, item.email, item.telefono].some((field) => String(field || "").toLowerCase().includes(search))
            )
          : users
      });
    }

    if (first === "admin" && second === "users" && third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const detail = await getAdminUserDetail(db, Number(third));

      if (!detail) {
        throw httpError(404, "El usuario no existe.");
      }

      return json({
        user: detail.user,
        cart: detail.cart?.items || [],
        orders: detail.historial?.ordenes || []
      });
    }

    if (first === "admin" && second === "users" && third && segments[3] === "status" && request.method === "PATCH") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      const updated = await setUserActiveStatus(db, Number(third), Boolean(body?.isActive));

      if (!updated) {
        throw httpError(404, "El usuario no existe.");
      }

      return json({
        ok: true,
        user: serializeUser(updated)
      });
    }

    if (first === "admin" && second === "carts" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({
        items: await listAdminCarts(db)
      });
    }

    if (first === "admin" && second === "order-items" && third && request.method === "PATCH") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      return json(await updateOrderItemStatus(db, Number(third), body.estado));
    }

    if (first === "admin" && second === "orders" && third && request.method === "PUT") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      return json(await updateOrderTracking(db, third, body.tracking));
    }

    if (first === "admin" && second === "orders" && third && request.method === "PATCH") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      return json(await updateOrderStatus(db, third, body.estado));
    }

    if (first === "admin" && second === "orders" && third && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json(await deleteOrder(db, third));
    }

    if (first === "admin" && second === "comments" && third && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json(await deleteProductComment(db, Number(third)));
    }

    if (first === "admin" && second === "reviews" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({
        items: await listAdminReviewItems(db)
      });
    }

    if (first === "admin" && second === "reviews" && third && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json(await deleteProductComment(db, Number(third)));
    }

    if (first === "admin" && second === "categories" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({
        items: buildCategoryItems()
      });
    }

    if (first === "admin" && second === "content" && !third && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const content = await getSiteContent(db);
      return json({
        homepage: content.home || {},
        general: content.general || {},
        banners: Array.isArray(content.banners) ? content.banners : [],
        videos: Array.isArray(content.videos) ? content.videos : [],
        music: Array.isArray(content.music) ? content.music : [],
        reviewDesk: Array.isArray(content.reviewDesk) ? content.reviewDesk : []
      });
    }

    if (first === "admin" && second === "content" && third && request.method === "PUT") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      const scopeMap = {
        homepage: "home",
        general: "general",
        banners: "banners",
        videos: "videos",
        music: "music"
      };
      const key = scopeMap[third] || third;
      return json(await updateSiteContent(db, key, body));
    }

    if (first === "admin" && ["banners", "videos", "music"].includes(second) && request.method === "POST") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      const content = await getSiteContent(db);
      const current = Array.isArray(content[second]) ? content[second] : [];
      const next = [...current, { id: crypto.randomUUID(), ...body }];
      return json(await updateSiteContent(db, second, next), 201);
    }

    if (first === "admin" && ["banners", "videos", "music"].includes(second) && third && request.method === "PATCH") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      const content = await getSiteContent(db);
      const current = Array.isArray(content[second]) ? content[second] : [];
      const next = current.map((item) => (String(item.id) === String(third) ? { ...item, ...body } : item));
      return json(await updateSiteContent(db, second, next));
    }

    if (first === "admin" && second === "media" && segments[2] && segments[3] && request.method === "DELETE") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const mediaType = segments[2];
      const mediaId = segments[3];
      const sectionMap = {
        banner: "banners",
        video: "videos",
        music: "music"
      };
      const section = sectionMap[mediaType];

      if (!section) {
        throw httpError(400, "Tipo de medio invalido.");
      }

      const content = await getSiteContent(db);
      const current = Array.isArray(content[section]) ? content[section] : [];
      const next = current.filter((item) => String(item.id) !== String(mediaId));
      return json(await updateSiteContent(db, section, next));
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

    if (first === "admin" && second === "products" && third && request.method === "PATCH") {
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

    if (first === "admin" && second === "site-content" && third && request.method === "PUT") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      return json({
        section: await updateSiteContent(db, third, body)
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
