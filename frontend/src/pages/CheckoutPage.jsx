import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StripeCheckoutBox } from "../components/StripeCheckoutBox.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

const initialAddress = {
  calle: "",
  ciudad: "",
  estado: "",
  cp: "",
  pais: "MX"
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
  const [order, setOrder] = useState(null);
  const [stripeClientSecret, setStripeClientSecret] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    apiFetch("/checkout/summary", { token })
      .then((payload) => {
        if (active) {
          setSummary(payload);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const startProviderFlow = async (createdOrder) => {
    if (provider === "stripe") {
      const payload = await apiFetch("/payments/stripe/payment-intent", {
        method: "POST",
        token,
        body: { orderId: createdOrder.id }
      });

      setStripeClientSecret(payload.clientSecret);
      setMessage("Orden creada. Completa el formulario de Stripe.");
      return;
    }

    if (provider === "paypal") {
      const payload = await apiFetch("/payments/paypal/order", {
        method: "POST",
        token,
        body: { orderId: createdOrder.id }
      });

      if (payload.approvalUrl) {
        window.location.href = payload.approvalUrl;
        return;
      }

      setMessage("Se creo la orden de PayPal, pero no llego la URL de aprobacion.");
      return;
    }

    const payload = await apiFetch("/payments/mercadopago/preference", {
      method: "POST",
      token,
      body: { orderId: createdOrder.id }
    });

    if (payload.initPoint) {
      window.location.href = payload.initPoint;
      return;
    }

    setMessage("Se creo la preferencia de Mercado Pago, pero no llego la URL de pago.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setStripeClientSecret("");

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
      await startProviderFlow(payload.order);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-loader">Preparando checkout...</div>;
  }

  return (
    <div className="page-section page-section--spaced">
      <div className="section-header">
        <div>
          <p className="section-label">Checkout</p>
          <h1>Confirma envio y elige como quieres pagar</h1>
        </div>
      </div>

      {summary?.items?.length ? (
        <div className="checkout-layout">
          <form className="card" onSubmit={handleSubmit}>
            <h2>Direccion de envio</h2>
            <div className="form-grid">
              <label>
                Calle
                <input
                  type="text"
                  value={address.calle}
                  onChange={(event) => setAddress((current) => ({ ...current, calle: event.target.value }))}
                  required
                />
              </label>
              <label>
                Ciudad
                <input
                  type="text"
                  value={address.ciudad}
                  onChange={(event) => setAddress((current) => ({ ...current, ciudad: event.target.value }))}
                  required
                />
              </label>
              <label>
                Estado
                <input
                  type="text"
                  value={address.estado}
                  onChange={(event) => setAddress((current) => ({ ...current, estado: event.target.value }))}
                  required
                />
              </label>
              <label>
                Codigo postal
                <input
                  type="text"
                  value={address.cp}
                  onChange={(event) => setAddress((current) => ({ ...current, cp: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label>
              Pais
              <input
                type="text"
                value={address.pais}
                onChange={(event) => setAddress((current) => ({ ...current, pais: event.target.value }))}
                required
              />
            </label>

            <div className="payment-grid">
              <button
                type="button"
                className={`payment-card ${provider === "mercadopago" ? "is-selected" : ""}`}
                onClick={() => setProvider("mercadopago")}
              >
                <strong>Mercado Pago</strong>
                <span>Recomendado para Mexico</span>
              </button>
              <button
                type="button"
                className={`payment-card ${provider === "paypal" ? "is-selected" : ""}`}
                onClick={() => setProvider("paypal")}
              >
                <strong>PayPal</strong>
                <span>Pago y aprobacion externa</span>
              </button>
              <button
                type="button"
                className={`payment-card ${provider === "stripe" ? "is-selected" : ""}`}
                onClick={() => setProvider("stripe")}
              >
                <strong>Stripe</strong>
                <span>Pago embebido con tarjeta</span>
              </button>
            </div>

            {message && <p className="inline-message">{message}</p>}

            <button type="submit" className="button button--primary" disabled={submitting}>
              {submitting ? "Creando orden..." : "Crear orden y continuar"}
            </button>

            {stripeClientSecret && <StripeCheckoutBox clientSecret={stripeClientSecret} orderId={order?.id} />}
          </form>

          <aside className="card summary-card">
            <p className="section-label">Resumen</p>
            <h2>${summary.total.toFixed(2)}</h2>
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

            {order && (
              <div className="status-box">
                <strong>Orden creada</strong>
                <span>{order.id}</span>
                <span>{order.estado}</span>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <p>No hay productos en tu carrito para continuar.</p>
          <Link to="/" className="button button--primary">
            Volver al catalogo
          </Link>
        </div>
      )}
    </div>
  );
}
