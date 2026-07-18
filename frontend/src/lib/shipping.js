export const SUPPORT_WHATSAPP_NUMBER = "529616205707";
export const INTERNATIONAL_SHIPPING_MESSAGE = "El costo del envio puede variar segun el producto.";
export const INTERNATIONAL_CHECKOUT_MESSAGE =
  "Contactate con soporte para seguimiento de tu compra y pago del envio.";

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isMexicoCountry(country) {
  const value = normalizeText(country);
  return ["mexico", "mx", "mex"].includes(value);
}

export function getUserCountry(user) {
  return user?.direccion?.pais || user?.pais || "Mexico";
}

export function getShippingVisibilityText(country, product = {}) {
  if (isMexicoCountry(country)) {
    return "Envio Gratis";
  }

  return INTERNATIONAL_SHIPPING_MESSAGE;
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatVariant(variant) {
  if (variant?.color?.nombre) {
    return ` | Color: ${variant.color.nombre}`;
  }

  return "";
}

export function buildOrderSupportWhatsappUrl(order, options = {}) {
  const address = order?.direccionEnvio || order?.direccion || options.address || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const lines = [
    "Hola, necesito soporte para seguimiento de mi compra y pago del envio.",
    `Orden: ${order?.id || "Por confirmar"}`,
    `Total: ${formatMoney(order?.total)}`,
    `Pais: ${address.pais || "No especificado"}`,
    `Direccion: ${[address.calle, address.ciudad, address.estado, address.cp].filter(Boolean).join(", ") || "No especificada"}`
  ];

  if (items.length) {
    lines.push("Productos:");
    items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.nombre || "Producto"} | Folio: ${item.folio || "Pendiente"} | Producto ID: ${
          item.productoId || item.productId || "N/A"
        } | Cantidad: ${item.cantidad || 1} | Precio: ${formatMoney(item.precio)}${formatVariant(item.variante)}`
      );
    });
  }

  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
