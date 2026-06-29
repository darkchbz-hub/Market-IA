import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

const PAYPAL_QR_URL = "/assets/paypal-payment-qr.png";

function statusLabel(status) {
  const value = String(status || "").trim().toLowerCase();
  if (["paid", "pagado"].includes(value)) return "Pagado";
  if (["cancelled", "canceled", "cancelado"].includes(value)) return "Cancelado";
  if (["pending_payment", "pending", "pendiente", "pago_pendiente", "created", "processing"].includes(value)) {
    return "Pendiente por pagar";
  }
  return "Pendiente por pagar";
}

function statusClass(status) {
  const value = String(status || "").trim().toLowerCase();
  if (["paid", "pagado"].includes(value)) return "status-pill status-pill--paid";
  if (["cancelled", "canceled", "cancelado"].includes(value)) return "status-pill status-pill--cancelled";
  return "status-pill status-pill--pending";
}

const initialAddress = {
  calle: "",
  ciudad: "",
  estado: "",
  cp: "",
  pais: "Mexico"
};

export function CheckoutPage() {
  const { token, user } = useAuth();
  const { refreshCart } = useCart();
  const [summary, setSummary] = useState(null);
  const [address, setAddress] = useState(() => ({
    ...initialAddress,
    ...(user?.direccion || {})
  }));
  const [provider, setProvider] = useState("mercadopago");
  const [paymentLinks, setPaymentLinks] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    apiFetch("/checkout/summary", { token })
      .then((payload) => setSummary(payload))
      .catch((error) => setMessage(error.message));
  }, [token]);

  useEffect(() => {
    apiFetch("/products/home")
      .then((payload) => setPaymentLinks(payload?.general?.paymentLinks || {}))
      .catch(() => setPaymentLinks({}));
  }, []);

  const buildRedirectUrl = (baseUrl, createdOrder) => {
    if (!baseUrl) {
      return "";
    }

    const text = `Pedido ${createdOrder.id} | Total $${(createdOrder.total || 0).toFixed(2)} | Metodo ${provider}`;
    const isWhatsapp = /wa\.me|whatsapp\.com/i.test(baseUrl);

    try {
      const parsed = new URL(baseUrl);
      if (isWhatsapp) {
        parsed.searchParams.set("text", text);
      } else {
        parsed.searchParams.set("orderId", createdOrder.id);
        parsed.searchParams.set("provider", provider);
      }
      return parsed.toString();
    } catch {
      return baseUrl;
    }
  };

  const continueWithProvider = async (createdOrder) => {
    if (provider === "paypal") {
      window.location.href = buildRedirectUrl(PAYPAL_QR_URL, createdOrder);
      return;
    }

    const customLink = paymentLinks?.[provider] || "";
    const redirectLink = buildRedirectUrl(customLink, createdOrder);

    if (redirectLink) {
      window.location.href = redirectLink;
      return;
    }

    setMessage("No hay un link de pago configurado para este metodo. Elige otro metodo o contacta soporte.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const payload = await apiFetch("/checkout/orders", {
        method: "POST",
        token,
        body: {
          direccion: address,
          proveedorPago: provider
        }
      });

      setOrder(payload.order);
      await refreshCart();
      await continueWithProvider(payload.order);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!summary?.items?.length) {
    return (
      <div className="empty-state">
        <p>No hay productos listos para checkout.</p>
        <Link to="/catalogo" className="button button--primary">
          Ir al catalogo
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <form className="section-card" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <p className="section-label">Checkout</p>
            <h1>Confirma tu direccion y metodo de pago</h1>
          </div>
        </div>

        <div className="form-grid form-grid--wide">
          <label>
            Calle
            <input value={address.calle} onChange={(event) => setAddress((current) => ({ ...current, calle: event.target.value }))} required />
          </label>
          <label>
            Ciudad
            <input value={address.ciudad} onChange={(event) => setAddress((current) => ({ ...current, ciudad: event.target.value }))} required />
          </label>
          <label>
            Estado
            <input value={address.estado} onChange={(event) => setAddress((current) => ({ ...current, estado: event.target.value }))} required />
          </label>
          <label>
            Codigo postal
            <input value={address.cp} onChange={(event) => setAddress((current) => ({ ...current, cp: event.target.value }))} required />
          </label>
        </div>

        <label>
          Pais
          <input value={address.pais} onChange={(event) => setAddress((current) => ({ ...current, pais: event.target.value }))} required />
        </label>

        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Pago</p>
            <h2>Selecciona tu metodo</h2>
          </div>
        </div>

        <div className="payment-grid">
          {[
            { id: "mercadopago", title: "Mercado Pago", description: "Transferencia o pago guiado por link personalizado." },
            { id: "paypal", title: "PayPal", description: "Pago con posible comision segun tu configuracion." },
            { id: "stripe", title: "Tarjeta", description: "Visa / Mastercard por link configurado." }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`payment-card ${provider === item.id ? "is-selected" : ""}`}
              onClick={() => setProvider(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.description}</span>
              {paymentLinks?.[item.id] && <small>Link activo</small>}
            </button>
          ))}
        </div>

        {message && <p className="inline-message">{message}</p>}

        <div className="checkout-actions">
          <button type="submit" className="button button--primary" disabled={submitting}>
            {submitting ? "Generando pedido..." : "Crear pedido y continuar"}
          </button>
        </div>
      </form>

      <aside className="section-card order-summary">
        <p className="section-label">Resumen del pedido</p>
        <div className="list-stack">
          {summary.items.map((item) => (
            <article key={item.productoId} className="mini-item">
              <strong>{item.nombre}</strong>
              <span>
                {item.cantidad} x ${item.precio.toFixed(2)}
              </span>
            </article>
          ))}
        </div>
        <div className="summary-row">
          <span>Subtotal</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>
        <div className="summary-row">
          <span>Envio</span>
          <strong>$0.00</strong>
        </div>
        <div className="summary-row summary-row--total">
          <span>Total</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>

        {order && (
          <div className="status-box">
            <strong>Pedido creado</strong>
            <span>{order.id}</span>
            <span className={statusClass(order.estado)}>{statusLabel(order.estado)}</span>
          </div>
        )}
      </aside>
    </div>
  );
}
