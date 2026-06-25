import { query } from "../../db/pool.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../shared/http-error.js";

function mapMessageRow(row) {
  return {
    id: row.id,
    usuarioId: row.user_id,
    rolRemitente: row.sender_role,
    mensaje: row.mensaje,
    leido: row.leido,
    fecha: row.created_at
  };
}

export async function createMessage({ userId, senderRole, mensaje }) {
  if (!userId) {
    throw new HttpError(400, "No se encontro la conversacion del usuario.");
  }

  if (!mensaje?.trim()) {
    throw new HttpError(400, "El mensaje no puede estar vacio.");
  }

  const { rows } = await query(
    `
      INSERT INTO messages (user_id, sender_role, mensaje, leido)
      VALUES ($1, $2, $3, FALSE)
      RETURNING *
    `,
    [userId, senderRole, mensaje.trim()]
  );

  return mapMessageRow(rows[0]);
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

function formatStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["paid", "completed", "pagado"].includes(value)) return "pagado";
  if (["cancelled", "canceled", "cancelado"].includes(value)) return "cancelado";
  if (["pending_payment", "pending", "pendiente"].includes(value)) return "pendiente";
  return value || "sin estado";
}

function summarizeNames(items, emptyText) {
  const names = items.map((item) => item.nombre).filter(Boolean).slice(0, 3);
  return names.length ? names.join(", ") : emptyText;
}

function botInstructions(botId) {
  const shared =
    "Eres un asistente de una tienda online. Responde en espanol, rapido, claro y amable. Usa solo el contexto enviado: catalogo, categorias, perfil, carrito, compras y pagos del usuario. No inventes stock, precios, pedidos ni politicas. Si falta un dato, dilo y ofrece el siguiente paso. No reveles datos privados de otros usuarios ni secretos del sistema.";

  if (botId === "grayce") {
    return `${shared} Tu nombre es Grayce. Tu especialidad es recomendar productos, ofertas, categorias y opciones segun presupuesto, carrito e intereses del cliente.`;
  }

  if (botId === "barban") {
    return `${shared} Tu nombre es BarbaN. Tu especialidad es soporte: pedidos, envios, entregas, cancelaciones, devoluciones y cuando escalar a un asesor humano.`;
  }

  return `${shared} Tu nombre es Taz. Tu especialidad es dar informes de cuenta del propio usuario: carrito, compras, pagos, totales, estado de pedidos y resumen de actividad.`;
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

async function buildAiReply({ botId, user, orders, orderItemsByOrder, cartItems, recommendations, siteContext, userText }) {
  const apiKey = env.openaiApiKey;

  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const ordersForContext = orders.map((order) => ({
      id: order.id,
      estado: order.estado,
      pago: order.payment_status,
      envio: order.shipping_status,
      proveedorPago: order.payment_provider,
      total: Number(order.total_cents || 0) / 100,
      fecha: order.created_at,
      items: orderItemsByOrder.get(order.id) || []
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: env.openaiModel,
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
          carrito: cartItems,
          pedidos: ordersForContext,
          recomendacionesBase: recommendations
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

function buildAssistantReply({ botId, user, orders, orderItemsByOrder, cartItems, recommendations, siteContext = {}, userText }) {
  const text = String(userText || "").toLowerCase();
  const latestOrder = orders[0];
  const activeOrders = orders.filter((order) => !["cancelled", "canceled", "cancelado"].includes(String(order.estado || "").toLowerCase()));
  const paidOrders = orders.filter((order) => ["paid", "completed"].includes(String(order.payment_status || "").toLowerCase()));
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const latestItems = latestOrder ? orderItemsByOrder.get(latestOrder.id) || [] : [];
  const recommendedText = summarizeNames(recommendations, "los productos destacados de la tienda");
  const categoryText = summarizeNames(siteContext.categorias || [], "categorias principales");
  const siteKnowledge = `Conozco el catalogo disponible, categorias como ${categoryText}, productos destacados como ${recommendedText}, tu carrito, tus compras y tus pagos registrados.`;

  if (/pagina|tienda|catalogo|categorias|secciones|que sabes|sabes de/.test(text)) {
    const botName = botId === "grayce" ? "Grayce" : botId === "barban" ? "BarbaN" : "Taz";
    return `${botName}: ${siteKnowledge} Preguntame por recomendaciones, pedidos, carrito o pagos y te contesto con lo que exista en tu cuenta.`;
  }

  if (botId === "grayce") {
    const cartHint = cartItems.length ? `Veo en tu carrito: ${summarizeNames(cartItems, "productos guardados")}.` : "Aun no tienes productos en carrito.";
    return `Grayce: Hola ${user.nombre}. ${cartHint} Por lo que puede interesarte, te recomiendo revisar ${recommendedText}. Si me dices una categoria o presupuesto, te puedo orientar mejor.`;
  }

  if (botId === "barban") {
    if (/asesor|humano|persona|agente/i.test(text)) {
      return "BarbaN: Te dejo en espera para soporte humano. Si el administrador no esta conectado, tu mensaje quedara guardado con el historial del pedido.";
    }

    if (latestOrder) {
      return `BarbaN: Tu pedido mas reciente es ${latestOrder.id}, estado ${formatStatus(latestOrder.estado)} y pago ${formatStatus(latestOrder.payment_status)}. Productos: ${summarizeNames(latestItems, "sin detalle de items")}. Si hubo problema de entrega o pago, escribe que necesitas revisar y lo dejo documentado.`;
    }

    return "BarbaN: No encuentro pedidos todavia en tu cuenta. Puedo ayudarte con pagos, tiempos de entrega, cancelaciones o conectar con soporte humano.";
  }

  const latestOrderText = latestOrder
    ? `Ultima compra ${latestOrder.id}: ${formatCurrency(Number(latestOrder.total_cents || 0) / 100)}, estado ${formatStatus(latestOrder.estado)}, pago ${formatStatus(latestOrder.payment_status)}.`
    : "Sin compras registradas todavia.";

  return `Taz: Informe de ${user.email}: ${orders.length} compra(s), ${activeOrders.length} pedido(s) activo(s), ${paidOrders.length} pago(s) confirmado(s). Carrito actual: ${cartCount} articulo(s), total aproximado ${formatCurrency(cartTotal)}. ${latestOrderText}`;
}

export async function createAssistantMessage({ userId, botId, userText }) {
  if (!userId) {
    throw new HttpError(400, "No se encontro la cuenta para el asistente.");
  }

  if (!userText?.trim()) {
    throw new HttpError(400, "Escribe un mensaje para el asistente.");
  }

  const [userResult, ordersResult, cartResult, recommendationsResult, categoriesResult, settingsResult] = await Promise.all([
    query(
      `
        SELECT id, nombre, email, nickname
        FROM users
        WHERE id = $1
      `,
      [userId]
    ),
    query(
      `
        SELECT id, estado, payment_status, shipping_status, payment_provider, total_cents, created_at
        FROM orders
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 8
      `,
      [userId]
    ),
    query(
      `
        SELECT c.product_id, c.cantidad, p.nombre, p.categoria, p.precio_cents
        FROM cart_items c
        INNER JOIN products p ON p.id = c.product_id
        WHERE c.user_id = $1
        ORDER BY c.updated_at DESC
      `,
      [userId]
    ),
    query(
      `
        SELECT nombre, categoria, precio_cents
        FROM products
        WHERE is_active = TRUE
        ORDER BY recomendado DESC, mas_vendido DESC, destacado DESC, created_at DESC
        LIMIT 16
      `
    ),
    query(
      `
        SELECT nombre, slug, descripcion
        FROM categories
        WHERE is_active = TRUE
        ORDER BY featured DESC, sort_order ASC, nombre ASC
        LIMIT 20
      `
    ),
    query(
      `
        SELECT scope, content
        FROM site_settings
        WHERE scope IN ('general', 'homepage', 'terms')
      `
    )
  ]);

  const user = userResult.rows[0];
  if (!user) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  const orders = ordersResult.rows;
  const orderItemsByOrder = new Map();

  if (orders.length) {
    const placeholders = orders.map((_, index) => `$${index + 1}`).join(", ");
    const orderItemsResult = await query(
      `
        SELECT order_id, nombre_producto, cantidad, precio_cents
        FROM order_items
        WHERE order_id IN (${placeholders})
        ORDER BY id ASC
      `,
      orders.map((order) => order.id)
    );

    for (const row of orderItemsResult.rows) {
      const list = orderItemsByOrder.get(row.order_id) || [];
      list.push({
        nombre: row.nombre_producto,
        cantidad: Number(row.cantidad || 0),
        precio: Number(row.precio_cents || 0) / 100
      });
      orderItemsByOrder.set(row.order_id, list);
    }
  }

  const cartItems = cartResult.rows.map((row) => ({
    nombre: row.nombre,
    categoria: row.categoria,
    cantidad: Number(row.cantidad || 0),
    precio: Number(row.precio_cents || 0) / 100,
    subtotal: (Number(row.precio_cents || 0) * Number(row.cantidad || 0)) / 100
  }));
  const recommendations = recommendationsResult.rows.map((row) => ({
    nombre: row.nombre,
    categoria: row.categoria,
    precio: Number(row.precio_cents || 0) / 100
  }));
  const siteContext = {
    categorias: categoriesResult.rows.map((row) => ({
      nombre: row.nombre,
      slug: row.slug,
      descripcion: row.descripcion || ""
    })),
    productos: recommendations,
    contenido: settingsResult.rows.reduce((acc, row) => {
      acc[row.scope] = row.content;
      return acc;
    }, {})
  };

  const normalizedBotId = ["grayce", "barban", "taz"].includes(String(botId || "").toLowerCase())
    ? String(botId).toLowerCase()
    : "taz";
  const aiReply = await buildAiReply({
    botId: normalizedBotId,
    user,
    orders,
    orderItemsByOrder,
    cartItems,
    recommendations,
    siteContext,
    userText
  });
  const reply = aiReply || buildAssistantReply({
    botId: normalizedBotId,
    user,
    orders,
    orderItemsByOrder,
    cartItems,
    recommendations,
    siteContext,
    userText
  });

  return createMessage({
    userId,
    senderRole: "bot",
    mensaje: reply
  });
}

export async function markConversationAsRead({ userId, readerRole }) {
  const counterpartRole = readerRole === "admin" ? "customer" : "admin";

  await query(
    `
      UPDATE messages
      SET leido = TRUE
      WHERE user_id = $1
        AND sender_role = $2
        AND leido = FALSE
    `,
    [userId, counterpartRole]
  );
}

export async function listThreads() {
  const { rows } = await query(
    `
      SELECT
        m.user_id,
        u.nombre,
        u.email,
        MAX(m.created_at) AS ultimo_mensaje_en,
        COUNT(*) FILTER (WHERE m.leido = FALSE AND m.sender_role = 'customer')::int AS pendientes
      FROM messages m
      INNER JOIN users u ON u.id = m.user_id
      GROUP BY m.user_id, u.nombre, u.email
      ORDER BY ultimo_mensaje_en DESC
    `
  );

  return rows.map((row) => ({
    usuarioId: row.user_id,
    nombre: row.nombre,
    email: row.email,
    ultimoMensajeEn: row.ultimo_mensaje_en,
    mensajesSinLeer: row.pendientes
  }));
}

export async function listConversation({ viewerRole, viewerId, targetUserId }) {
  const userId = viewerRole === "admin" ? targetUserId : viewerId;

  if (!userId) {
    throw new HttpError(400, "Debes indicar el usuario de la conversacion.");
  }

  const { rows } = await query(
    `
      SELECT *
      FROM messages
      WHERE user_id = $1
      ORDER BY created_at ASC
    `,
    [userId]
  );

  await markConversationAsRead({
    userId,
    readerRole: viewerRole
  });

  return rows.map(mapMessageRow);
}
