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
  bulkCreateProducts,
  canUserCommentOnProduct,
  clearCart,
  clearAllProducts,
  createChatMessage,
  createOrderFromCart,
  createAdminProductComment,
  createProductComment,
  createProduct,
  createUser,
  deleteOrder,
  decrementStockForOrder,
  deleteRegistrationCode,
  deleteProductComment,
  deleteProduct,
  ensureDatabase,
  getAdminUserDetail,
  getCartState,
  getOrderById,
  getOrderWithItems,
  getProductById,
  getRegistrationCode,
  getSiteContent,
  getUserByEmail,
  getUserById,
  getUserDashboard,
  generateCatalogProducts,
  isNicknameAvailable,
  listAdminUsers,
  listAdminProducts,
  listAdminCarts,
  listChatMessagesByUser,
  listChatThreads,
  listAdminOrders,
  listProductComments,
  listProducts,
  marketplaceCategories,
  markOrderStatus,
  recordProductView,
  recordSearch,
  restoreAdminUser,
  savePaymentRecord,
  saveRegistrationCode,
  serializeUser,
  setCartItem,
  setUserActiveStatus,
  updateSiteContent,
  updateAdminProductComment,
  updateOrderItemStatus,
  updateOrderStatus,
  updateOrderTracking,
  updateProduct,
  updateUserAddress,
  bumpRegistrationCodeAttempt
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

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getEmailDomain(email) {
  return String(email || "").trim().toLowerCase().split("@")[1] || "";
}

function buildRegisterPayloadFromBody(body) {
  return {
    nombre: String(body.nombre || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    password: String(body.password || ""),
    telefono: String(body.telefono || "").trim(),
    nickname: String(body.nickname || "").trim(),
    direccion: normalizeAddress(body.direccion),
    avatarUrl: String(body.avatarUrl || "").trim(),
    geoMeta: normalizeGeoMeta(body.geoMeta),
    acceptedTerms: Boolean(body.acceptedTerms)
  };
}

async function validateRegisterPayloadOrThrow(db, payload) {
  const siteContent = await getSiteContent(db);
  const configuredInviteCode = String(siteContent?.general?.signupInviteCode || "").trim();
  const allowedDomains = normalizeEmailDomains(siteContent?.general?.allowedEmailDomains);
  const emailDomain = getEmailDomain(payload.email);

  if (!payload.nombre || !validateEmail(payload.email) || payload.password.length < 6) {
    throw httpError(400, "Completa nombre, email valido y una contrasena de al menos 6 caracteres.");
  }
  if (emailDomain !== "gmail.com") {
    throw httpError(400, "Solo se aceptan correos Gmail (@gmail.com).");
  }
  if (allowedDomains.length && !allowedDomains.includes(emailDomain)) {
    throw httpError(400, "Este dominio de correo no esta permitido para registro.");
  }
  if (!payload.nickname) {
    throw httpError(400, "El nickname es obligatorio.");
  }
  if (!payload.acceptedTerms) {
    throw httpError(400, "Debes aceptar los terminos y condiciones para crear tu cuenta.");
  }
  if (!payload.telefono || !payload.direccion.calle || !payload.direccion.ciudad || !payload.direccion.estado || !payload.direccion.cp || !payload.direccion.pais) {
    throw httpError(400, "Completa todos los datos obligatorios para crear tu cuenta.");
  }
  if (!/^\d{6}$/.test(configuredInviteCode)) {
    throw httpError(500, "El codigo de invitacion del sistema no esta configurado correctamente.");
  }
}

async function sendVerificationEmail(env, toEmail, code) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  const fromEmail = String(env.RESEND_FROM_EMAIL || "").trim();
  const allowMailchannelsFallback = String(env.ENABLE_MAILCHANNELS_FALLBACK || "true").toLowerCase() === "true";
  const fallbackFrom = String(env.MAIL_FROM_EMAIL || fromEmail || "noreply@graycshop.trade").trim();

  if (!apiKey || !fromEmail) {
    if (!allowMailchannelsFallback) {
      throw httpError(503, "No se pudo enviar el correo. Configura RESEND_API_KEY y RESEND_FROM_EMAIL.");
    }
  } else {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: "Codigo de verificacion Gray C Shop",
          html: `<p>Tu codigo de verificacion es: <strong>${code}</strong></p><p>Este codigo expira en 10 minutos.</p>`
        })
      });

      if (response.ok) {
        return;
      }
    } catch {
      if (!allowMailchannelsFallback) {
        throw httpError(502, "No se pudo enviar el correo de verificacion en este momento.");
      }
    }
  }

  // Fallback for Cloudflare Workers without Resend: MailChannels.
  try {
    const fallbackResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: toEmail }]
          }
        ],
        from: {
          email: fallbackFrom,
          name: "Gray C Shop"
        },
        subject: "Codigo de verificacion Gray C Shop",
        content: [
          {
            type: "text/html",
            value: `<p>Tu codigo de verificacion es: <strong>${code}</strong></p><p>Este codigo expira en 10 minutos.</p>`
          }
        ]
      })
    });

    if (!fallbackResponse.ok) {
      throw new Error("fallback_not_ok");
    }
  } catch {
    throw httpError(503, "No se pudo enviar el correo de verificacion. Contacta a soporte.");
  }
}

function normalizeAddress(value) {
  const address = value && typeof value === "object" ? value : {};
  const localidad = String(address.localidad || "").trim();
  const ciudad = String(address.ciudad || "").trim() || localidad;

  return {
    calle: String(address.calle || "").trim(),
    localidad,
    ciudad,
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

function getAdminRecoveryKey(env) {
  return String(env.ADMIN_RECOVERY_KEY || "").trim();
}

function requireAdmin(user) {
  if (!user || user.role !== "admin") {
    throw httpError(403, "Solo el administrador puede hacer esto.");
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

function extractOpenAiText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function botInstructions(botId) {
  const shared =
    "Eres un asistente de una tienda online. Responde en espanol, rapido, claro y amable. Usa solo el contexto enviado: catalogo, categorias, portada, perfil, carrito, compras y pagos del usuario. No inventes stock, precios, pedidos ni politicas. Si falta un dato, dilo y ofrece el siguiente paso. No reveles datos privados de otros usuarios ni secretos del sistema.";

  if (botId === "grayce") {
    return `${shared} Tu nombre es Grayce. Tu especialidad es recomendar productos, ofertas, categorias y opciones segun presupuesto, carrito e intereses del cliente.`;
  }

  if (botId === "barban") {
    return `${shared} Tu nombre es BarbaN. Tu especialidad es soporte: pedidos, envios, entregas, cancelaciones, devoluciones y cuando escalar a un asesor humano.`;
  }

  return `${shared} Tu nombre es Taz. Tu especialidad es dar informes de cuenta del propio usuario: carrito, compras, pagos, totales, estado de pedidos y resumen de actividad.`;
}

async function buildOpenAiAssistantReply({ env, botId, user, dashboard, cart, userText, siteContext }) {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 260,
        instructions: botInstructions(botId),
        input: JSON.stringify({
          preguntaCliente: userText,
          bot: botId,
          usuario: {
            nombre: user.nombre,
            email: user.email,
            nickname: user.nickname || ""
          },
          sitio: siteContext,
          carrito: cart?.items || [],
          pedidos: dashboard?.historial?.ordenes || []
        })
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const text = extractOpenAiText(payload);
    if (!text) {
      return null;
    }

    const botName = botId === "grayce" ? "Grayce" : botId === "barban" ? "BarbaN" : "Taz";
    return text.startsWith(`${botName}:`) ? text : `${botName}: ${text}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function buildAssistantReply({ env, db, botId, user, dashboard, cart, userText }) {
  const text = String(userText || "").toLowerCase();
  const orders = Array.isArray(dashboard?.historial?.ordenes) ? dashboard.historial.ordenes : [];
  const pendingOrders = orders.filter((order) => ["pending_payment", "paid"].includes(String(order.estado || "")));
  const latestOrder = orders[0];
  const cartItems = Array.isArray(cart?.items) ? cart.items : [];
  const cartItemsCount = cartItems.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  const viewedProducts = Array.isArray(dashboard?.historial?.productosVistos) ? dashboard.historial.productosVistos : [];
  const recommendationNames = [
    ...cartItems.map((item) => item.nombre),
    ...viewedProducts.map((item) => item.producto?.nombre)
  ].filter(Boolean).slice(0, 3);
  const recommendationText = recommendationNames.length ? recommendationNames.join(", ") : "los productos destacados de la tienda";
  const [siteContent, catalog] = await Promise.all([
    getSiteContent(db),
    listProducts(db, { limit: 16 })
  ]);
  const siteContext = {
    general: sanitizePublicGeneral(siteContent.general),
    homepage: siteContent.home || {},
    categorias: buildCategoryItems(),
    productos: catalog.items || []
  };

  const aiReply = await buildOpenAiAssistantReply({
    env,
    botId,
    user,
    dashboard,
    cart,
    userText,
    siteContext
  });

  if (aiReply) {
    return aiReply;
  }

  let core = "";
  const categoryText = siteContext.categorias.map((item) => item.nombre).filter(Boolean).slice(0, 5).join(", ") || "categorias principales";
  const productText = siteContext.productos.map((item) => item.nombre).filter(Boolean).slice(0, 3).join(", ") || recommendationText;

  if (/pagina|tienda|catalogo|categorias|secciones|que sabes|sabes de/.test(text)) {
    const botName = botId === "grayce" ? "Grayce" : botId === "barban" ? "BarbaN" : "Taz";
    return `${botName}: Conozco el catalogo disponible, categorias como ${categoryText}, productos destacados como ${productText}, tu carrito, tus compras y tus pagos registrados. Preguntame por recomendaciones, pedidos, carrito o pagos y te contesto con lo que exista en tu cuenta.`;
  }

  if (/carrito|cart|agregad/.test(text)) {
    core = `Tienes ${cartItemsCount} articulo(s) en carrito con total aproximado de ${formatCurrency(cart?.total)}.`;
  } else if (/pedido|orden|id|seguimiento|estatus|estado/.test(text)) {
    if (latestOrder) {
      core = `Tu orden mas reciente es ${latestOrder.id} y su estado actual es ${latestOrder.estado}. Tambien tienes ${pendingOrders.length} pedido(s) activo(s).`;
    } else {
      core = "Aun no tienes pedidos registrados en tu cuenta.";
    }
  } else if (/pago|tarjeta|paypal|mercado\s*pago|transferencia|visa|mastercard/.test(text)) {
    core = "Puedes pagar por Mercado Pago, PayPal o tarjeta. Si un pago queda pendiente, vuelve a seleccionar forma de pago desde tu pedido.";
  } else if (/envio|entrega|llega|tiempo|dias/.test(text)) {
    core = latestOrder
      ? `Tu pedido ${latestOrder.id} muestra estado ${latestOrder.estado}. Revisa tracking en Tu cuenta > Tus compras para ver el avance.`
      : "Cuando tengas un pedido activo, aqui te mostraremos seguimiento y fecha estimada.";
  } else if (/cuenta|login|acceso|correo|codigo|verificacion|nickname/.test(text)) {
    core = `Tu cuenta esta vinculada a ${user.email}. Si el codigo de acceso falla, solicita uno nuevo desde registro.`;
  } else if (/cancelar|cancelacion|devolucion|reembolso/.test(text)) {
    core = "Puedes cancelar si el pedido no ha sido enviado. Si ya esta en proceso, soporte humano te ayuda a resolverlo.";
  } else if (/asesor|humano|agente|persona/.test(text)) {
    core = "Te conecto con un asesor humano para continuar personalmente con tu caso.";
  } else {
    core = `Puedo ayudarte con pedidos, carrito, pagos y cuenta. Hoy tienes ${orders.length} pedido(s) registrado(s) y ${cartItemsCount} articulo(s) en carrito.`;
  }

  if (botId === "grayce") {
    return `Grayce: Hola ${user.nombre}. ${core} Por tus intereses, revisaria ${recommendationText}. Si me dices presupuesto o categoria, te recomiendo algo mas exacto.`;
  }
  if (botId === "barban") {
    if (/asesor|humano|agente|persona/.test(text)) {
      return "BarbaN: Te dejo en espera para soporte humano. Si el administrador no esta conectado, tu mensaje queda guardado para seguimiento.";
    }
    return `BarbaN: Entendido. ${core} Si necesitas revisar un pedido especifico, enviame el folio o escribe que quieres hablar con asesor.`;
  }
  return `Taz: Informe rapido: ${orders.length} compra(s), ${pendingOrders.length} pedido(s) activo(s), ${cartItemsCount} articulo(s) en carrito y total aproximado ${formatCurrency(cart?.total)}. ${core}`;
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

function normalizeCountryCode(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "MX";
  }

  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }

  const key = raw
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/\s+/g, " ")
    .trim();

  const map = {
    mexico: "MX",
    "estados unidos": "US",
    "united states": "US",
    espana: "ES",
    spain: "ES",
    colombia: "CO",
    argentina: "AR",
    chile: "CL",
    peru: "PE",
    ecuador: "EC",
    bolivia: "BO",
    paraguay: "PY",
    uruguay: "UY",
    venezuela: "VE",
    brasil: "BR",
    brazil: "BR",
    canada: "CA",
    germany: "DE",
    alemania: "DE",
    france: "FR",
    francia: "FR",
    italy: "IT",
    italia: "IT",
    japan: "JP",
    japon: "JP",
    china: "CN",
    india: "IN",
    "united kingdom": "GB",
    "reino unido": "GB"
  };

  return map[key] || "MX";
}

async function lookupPostalLocations(countryInput, postalInput) {
  const postalCode = String(postalInput || "").trim();
  if (postalCode.length < 3) {
    throw httpError(400, "Ingresa un codigo postal valido.");
  }

  const countryCode = normalizeCountryCode(countryInput);
  const endpoint = `https://api.zippopotam.us/${countryCode.toLowerCase()}/${encodeURIComponent(postalCode)}`;

  let response;
  try {
    response = await fetch(endpoint, { method: "GET" });
  } catch {
    throw httpError(502, "No se pudo consultar el servicio de codigos postales.");
  }

  if (!response.ok) {
    throw httpError(404, "No encontramos coincidencias para ese codigo postal.");
  }

  const payload = await response.json();
  const placesRaw = Array.isArray(payload.places) ? payload.places : [];

  const localities = Array.from(
    new Set(
      placesRaw
        .map((item) => String(item["place name"] || "").trim())
        .filter(Boolean)
    )
  );

  const state = String(placesRaw[0]?.state || "").trim();

  return {
    countryCode: String(payload["country abbreviation"] || countryCode).toUpperCase(),
    country: String(payload.country || "").trim(),
    postalCode: String(payload["post code"] || postalCode).trim(),
    state,
    localities
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
    usuarioNombre: row.reviewer_name || row.nombre,
    reviewerName: row.reviewer_name || row.nombre,
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

    if (first === "geo" && second === "postal-lookup" && request.method === "GET") {
      const country = url.searchParams.get("country") || "MX";
      const postalCode = url.searchParams.get("cp") || url.searchParams.get("postalCode") || "";
      return json(await lookupPostalLocations(country, postalCode));
    }

    if (first === "auth" && second === "register" && !third && request.method === "POST") {
      throw httpError(400, "El registro ahora requiere verificacion por correo. Primero envia codigo y luego validalo.");
    }

    if (first === "auth" && second === "register" && third === "send-code" && request.method === "POST") {
      const body = await readJson(request);
      const payload = buildRegisterPayloadFromBody(body);
      const invitationCode = String(body.invitationCode || "").trim();
      const siteContent = await getSiteContent(db);
      const configuredInviteCode = String(siteContent?.general?.signupInviteCode || "").trim();

      await validateRegisterPayloadOrThrow(db, payload);

      if (!/^\d{6}$/.test(invitationCode)) {
        throw httpError(400, "Ingresa el codigo de invitacion de 6 digitos.");
      }
      if (invitationCode !== configuredInviteCode) {
        throw httpError(400, "El codigo de invitacion no es valido.");
      }

      const existing = await getUserByEmail(db, payload.email);
      if (existing) {
        throw httpError(409, "Ese email ya esta registrado.");
      }

      const code = generateSixDigitCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await saveRegistrationCode(db, payload.email, payload, code, expiresAt);
      await sendVerificationEmail(env, payload.email, code);

      return json({
        ok: true,
        message: "Te enviamos un codigo de verificacion a tu correo."
      });
    }

    if (first === "auth" && second === "register" && third === "verify-code" && request.method === "POST") {
      const body = await readJson(request);
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.code || "").trim();

      if (!validateEmail(email) || !/^\d{6}$/.test(code)) {
        throw httpError(400, "Completa email y codigo valido de 6 digitos.");
      }

      const record = await getRegistrationCode(db, email);
      if (!record) {
        throw httpError(400, "No hay un codigo pendiente para este correo.");
      }

      if (new Date(record.expires_at).getTime() < Date.now()) {
        await deleteRegistrationCode(db, email);
        throw httpError(400, "El codigo expiro. Solicita uno nuevo.");
      }

      if (Number(record.attempts || 0) >= 6) {
        await deleteRegistrationCode(db, email);
        throw httpError(400, "Superaste el limite de intentos. Solicita un nuevo codigo.");
      }

      if (String(record.code) !== code) {
        await bumpRegistrationCodeAttempt(db, email);
        throw httpError(400, "El codigo ingresado no es correcto.");
      }

      const payload = JSON.parse(String(record.payload || "{}"));
      await validateRegisterPayloadOrThrow(db, payload);

      const existing = await getUserByEmail(db, email);
      if (existing) {
        await deleteRegistrationCode(db, email);
        throw httpError(409, "Ese email ya esta registrado.");
      }

      const passwordHash = await hashPassword(String(payload.password || ""));
      const user = await createUser(db, {
        nombre: payload.nombre,
        email: payload.email,
        passwordHash,
        telefono: payload.telefono,
        nickname: payload.nickname,
        avatarUrl: payload.avatarUrl,
        direccion: payload.direccion,
        geoMeta: payload.geoMeta
      });

      await deleteRegistrationCode(db, email);
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

    if (first === "auth" && second === "admin" && third === "recover" && request.method === "POST") {
      const body = await readJson(request);
      const recoveryKey = String(body.recoveryKey || "").trim();
      const expectedKey = getAdminRecoveryKey(env);
      const email = String(body.email || env.ADMIN_EMAIL || "admin@marketzone.mx").trim().toLowerCase();
      const password = String(body.password || env.ADMIN_PASSWORD || "");
      const nombre = String(body.nombre || "Administrador Gray C Shop").trim();

      if (!expectedKey) {
        throw httpError(503, "Configura ADMIN_RECOVERY_KEY antes de recuperar el administrador.");
      }
      if (recoveryKey !== expectedKey) {
        throw httpError(403, "La clave de recuperacion no es valida.");
      }
      if (!validateEmail(email) || password.length < 8) {
        throw httpError(400, "Envia email valido y contrasena de al menos 8 caracteres.");
      }

      const passwordHash = await hashPassword(password);
      const admin = await restoreAdminUser(db, {
        email,
        nombre,
        passwordHash,
        resetPassword: true
      });

      return json(await buildAuthPayload(admin, env));
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

    if (first === "messages" && second === "threads" && request.method === "GET") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      return json({ items: await listChatThreads(db) });
    }

    if (first === "messages" && !second && request.method === "GET") {
      const user = await authenticate(request, env, db);
      const requestedUserId = Number(url.searchParams.get("userId") || 0);
      const targetUserId = user.role === "admin" && requestedUserId > 0 ? requestedUserId : Number(user.id);

      return json({
        items: await listChatMessagesByUser(db, targetUserId)
      });
    }

    if (first === "messages" && !second && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const requestedUserId = Number(body.userId || 0);
      const targetUserId = user.role === "admin" && requestedUserId > 0 ? requestedUserId : Number(user.id);
      const senderRole = user.role === "admin" ? "admin" : "customer";

      const message = await createChatMessage(db, {
        userId: targetUserId,
        senderRole,
        mensaje: String(body.mensaje || body.message || "")
      });

      return json({ message }, 201);
    }

    if (first === "messages" && second === "assistant" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      const body = await readJson(request);
      const botId = String(body.botId || "taz").trim().toLowerCase();
      const userText = String(body.mensaje || body.message || "").trim();

      if (!userText) {
        throw httpError(400, "Escribe un mensaje para el asistente.");
      }

      const [dashboard, cart] = await Promise.all([getUserDashboard(db, user.id), getCartState(db, user.id)]);
      const reply = await buildAssistantReply({ env, db, botId, user: serializeUser(user), dashboard, cart, userText });

      const message = await createChatMessage(db, {
        userId: Number(user.id),
        senderRole: "bot",
        mensaje: reply
      });

      return json({ message }, 201);
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
              [item.nombre, item.email, item.telefono, item.nickname, JSON.stringify(item.direccion || {})].some((field) =>
                String(field || "").toLowerCase().includes(search)
              )
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
        cart: Array.isArray(detail.cart) ? detail.cart : detail.cart?.items || [],
        orders: detail.orders || detail.historial?.ordenes || []
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

    if (first === "admin" && second === "reviews" && !third && request.method === "POST") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      await createAdminProductComment(db, user.id, body);
      return json({
        items: await listAdminReviewItems(db)
      }, 201);
    }

    if (first === "admin" && second === "reviews" && third && request.method === "PATCH") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      await updateAdminProductComment(db, Number(third), body);
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

    if (first === "admin" && second === "products" && third === "import" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      const rows = Array.isArray(body.items) ? body.items : [];

      if (!rows.length) {
        throw httpError(400, "Comparte al menos un producto para importar.");
      }

      const importResult = await bulkCreateProducts(db, rows);
      return json(
        {
          ok: true,
          ...importResult
        },
        201
      );
    }

    if (first === "admin" && second === "products" && third === "generate" && request.method === "POST") {
      const user = await authenticate(request, env, db);
      requireAdmin(user);
      const body = await readJson(request);
      const generated = await generateCatalogProducts(db, {
        count: body.count,
        offset: body.offset,
        includeImages: body.includeImages,
        category: body.category
      });
      return json(
        {
          ok: true,
          ...generated
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
