import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

const PAYPAL_QR_URL = "/assets/paypal-payment-qr.png";

const initialAddress = {
  calle: "",
  ciudad: "",
  estado: "",
  cp: "",
  pais: "Mexico"
};

const shippingIconMap = {
  avion: "✈",
  barco: "🚢",
  tren: "🚆",
  coche: "🚗",
  moto: "🏍"
};

const shippingUpdateMessage =
  "Su pedido se modificara cada que llegue a una terminal, aduana, o almacen nuevo. Trabajamos con Mercado Libre, FedEx, DHL, J&T Express y Estafeta para un envio mas facil y en menos tiempo.";

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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { token, refreshUser, isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [paymentLinks, setPaymentLinks] = useState({});
  const [orderProviders, setOrderProviders] = useState({});
  const [activeReviewKey, setActiveReviewKey] = useState("");
  const [reviewForms, setReviewForms] = useState({});
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    nickname: "",
    avatarUrl: "",
    direccion: initialAddress
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDashboard = async () => {
    const payload = await apiFetch("/users/me", { token });
    setDashboard(payload);
    setForm({
      nombre: payload.user.nombre || "",
      email: payload.user.email || "",
      telefono: payload.user.telefono || "",
      nickname: payload.user.nickname || "",
      avatarUrl: payload.user.avatarUrl || "",
      direccion: {
        ...initialAddress,
        ...(payload.user.direccion || {})
      }
    });
  };

  useEffect(() => {
    loadDashboard().catch((error) => setMessage(error.message));
  }, [token]);

  useEffect(() => {
    apiFetch("/products/home")
      .then((payload) => setPaymentLinks(payload?.general?.paymentLinks || {}))
      .catch(() => setPaymentLinks({}));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await apiFetch("/users/me", {
        method: "PUT",
        token,
        body: form
      });

      await refreshUser();
      await loadDashboard();
      setMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (productId, isSaved) => {
    try {
      await apiFetch(`/users/me/favorites/${productId}`, {
        method: isSaved ? "DELETE" : "POST",
        token
      });
      await loadDashboard();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await apiFetch(`/users/me/orders/${orderId}/cancel`, {
        method: "POST",
        token
      });
      await loadDashboard();
      setMessage("Pedido cancelado correctamente.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const resolveProviderForOrder = (order) => {
    return orderProviders[order.id] || order.metodoPago || "mercadopago";
  };

  const isOrderPendingPayment = (order) => {
    const estado = String(order.estado || "").toLowerCase();
    const paymentStatus = String(order.paymentStatus || "").toLowerCase();

    const pendingOrderStates = ["pendiente", "pending", "pending_payment", "created", "pago_pendiente"];
    const pendingPaymentStates = ["pending", "pending_payment", "created", "processing", "requires_payment_method"];

    return pendingOrderStates.includes(estado) || pendingPaymentStates.includes(paymentStatus);
  };

  const canReviewOrder = (order) => {
    const estado = String(order.estado || "").toLowerCase();
    return ["paid", "pagado"].includes(estado);
  };

  const hasReviewedProduct = (productId) => {
    const reviewed = dashboard?.historial?.productosResenados || [];
    return reviewed.map(Number).includes(Number(productId));
  };

  const getReviewForm = (key) => {
    return reviewForms[key] || { rating: "5", comentario: "" };
  };

  const updateReviewForm = (key, nextValues) => {
    setReviewForms((current) => ({
      ...current,
      [key]: {
        ...(current[key] || { rating: "5", comentario: "" }),
        ...nextValues
      }
    }));
  };

  const submitProductReview = async (event, order, item) => {
    event.preventDefault();
    const key = `${order.id}-${item.id || item.productoId}`;
    const review = getReviewForm(key);

    setSaving(true);
    setMessage("");

    try {
      await apiFetch(`/products/${item.productoId}/comments`, {
        method: "POST",
        token,
        body: {
          rating: review.rating,
          comentario: review.comentario
        }
      });

      setReviewForms((current) => ({
        ...current,
        [key]: { rating: "5", comentario: "" }
      }));
      setDashboard((current) => ({
        ...current,
        historial: {
          ...current.historial,
          productosResenados: Array.from(new Set([...(current.historial.productosResenados || []), Number(item.productoId)]))
        }
      }));
      setActiveReviewKey("");
      setMessage("Gracias, tu reseña ya aparece en el producto.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const buildRedirectUrl = (baseUrl, order, provider) => {
    if (!baseUrl) {
      return "";
    }

    const text = `Pedido ${order.id} | Total $${order.total.toFixed(2)} | Metodo ${provider}`;
    const isWhatsapp = /wa\.me|whatsapp\.com/i.test(baseUrl);

    try {
      const parsed = new URL(baseUrl);
      if (isWhatsapp) {
        parsed.searchParams.set("text", text);
      } else {
        parsed.searchParams.set("orderId", order.id);
        parsed.searchParams.set("provider", provider);
      }
      return parsed.toString();
    } catch {
      return baseUrl;
    }
  };

  const retryPayment = async (order) => {
    const provider = resolveProviderForOrder(order);
    setMessage("");

    if (provider === "paypal") {
      window.location.href = buildRedirectUrl(PAYPAL_QR_URL, order, provider);
      return;
    }

    const customLink = paymentLinks?.[provider] || "";
    const redirectLink = buildRedirectUrl(customLink, order, provider);

    if (redirectLink) {
      window.location.href = redirectLink;
      return;
    }

    setMessage("No hay un link de pago configurado para este metodo. Elige otro metodo o contacta soporte.");
  };

  if (!dashboard) {
    return <div className="page-loader">{message || "Cargando tu cuenta..."}</div>;
  }

  return (
    <div className="page-stack">
      <div className="profile-shell">
        <form className="section-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <p className="section-label">Tu cuenta</p>
              <h1>Administra tu informacion personal</h1>
            </div>
          </div>

          <div className="form-grid form-grid--wide">
            <label>
              Nombre
              <input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            </label>
            <label>
              Correo
              <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Telefono
              <input value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} />
            </label>
            <label>
              Nickname
              <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} />
            </label>
          </div>

          <label>
            Foto de perfil
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const [file] = Array.from(event.target.files || []);
                if (!file) {
                  return;
                }
                const avatarUrl = await fileToDataUrl(file);
                setForm((current) => ({ ...current, avatarUrl }));
              }}
            />
          </label>

          <label>
            O pega URL/base64 de foto
            <input value={form.avatarUrl} onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))} />
          </label>

          {form.avatarUrl && (
            <div className="profile-avatar-preview">
              <img src={form.avatarUrl} alt="Vista previa de perfil" />
              <button type="button" className="button button--ghost" onClick={() => setForm((current) => ({ ...current, avatarUrl: "" }))}>
                Quitar foto
              </button>
            </div>
          )}

          <div className="form-grid form-grid--wide">
            <label>
              Calle
              <input value={form.direccion.calle} onChange={(event) => setForm((current) => ({ ...current, direccion: { ...current.direccion, calle: event.target.value } }))} />
            </label>
            <label>
              Ciudad
              <input value={form.direccion.ciudad} onChange={(event) => setForm((current) => ({ ...current, direccion: { ...current.direccion, ciudad: event.target.value } }))} />
            </label>
            <label>
              Estado
              <input value={form.direccion.estado} onChange={(event) => setForm((current) => ({ ...current, direccion: { ...current.direccion, estado: event.target.value } }))} />
            </label>
            <label>
              Codigo postal
              <input value={form.direccion.cp} onChange={(event) => setForm((current) => ({ ...current, direccion: { ...current.direccion, cp: event.target.value } }))} />
            </label>
          </div>

          <label>
            Pais
            <input value={form.direccion.pais} onChange={(event) => setForm((current) => ({ ...current, direccion: { ...current.direccion, pais: event.target.value } }))} />
          </label>

          {message && <p className="inline-message">{message}</p>}
          {isAdmin && (
            <Link to="/admin" className="button button--ghost">
              Ir al panel administrador
            </Link>
          )}
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        <div className="profile-shell__side">
          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Tus compras</p>
                <h2>Historial de pedidos</h2>
              </div>
            </div>
            <div className="list-stack">
              {dashboard.historial.ordenes.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card__head">
                    <strong>{order.id.slice(0, 8)}</strong>
                    <span className={statusClass(order.estado)}>{statusLabel(order.estado)}</span>
                  </div>
                  <small>{new Date(order.fecha).toLocaleString()}</small>
                  <p>Metodo: {order.metodoPago || "Por definir"} · Total: ${order.total.toFixed(2)}</p>
                  {order.items?.length > 0 && (
                    <div className="order-review-list">
                      <p>
                        Productos:{" "}
                        {order.items
                          .map((item) => `${item.nombre}${item.cantidad > 1 ? ` x${item.cantidad}` : ""}`)
                          .join(", ")}
                      </p>
                      {order.items.map((item) => {
                          const reviewKey = `${order.id}-${item.id || item.productoId}`;
                          const review = getReviewForm(reviewKey);
                          const isOpen = activeReviewKey === reviewKey;
                          const alreadyReviewed = hasReviewedProduct(item.productoId);
                          const canWriteReview = canReviewOrder(order);

                          return (
                            <div key={reviewKey} className="order-review-box">
                              <div className="order-review-box__head">
                                <span>{item.nombre} {item.folio ? `| Folio ${item.folio}` : ""}</span>
                                {alreadyReviewed && <span className="order-review-box__done">Ya has hecho una reseña de este producto</span>}
                                <button type="button" className={`button button--ghost${!canWriteReview || alreadyReviewed ? " order-review-box__hidden-action" : ""}`} disabled={!canWriteReview || alreadyReviewed} onClick={() => setActiveReviewKey(isOpen ? "" : reviewKey)}>
                                  {isOpen ? "Cerrar reseña" : "Escribir reseña"}
                                </button>
                              </div>
                              <div className="customer-shipping-status">
                                <div className="customer-shipping-status__icon" aria-hidden="true">
                                  {shippingIconMap[item.iconoEnvio || "coche"] || shippingIconMap.coche}
                                </div>
                                <div>
                                  <strong>Entrega estimada: {item.entregaEstimada || "Por definir"}</strong>
                                  <p>{item.detalleEnvio || "Tu paquete esta en preparacion. Actualizaremos este detalle pronto."}</p>
                                  <small>{shippingUpdateMessage}</small>
                                </div>
                              </div>
                              {canWriteReview && isOpen && !alreadyReviewed && (
                                <form className="order-review-form" onSubmit={(event) => submitProductReview(event, order, item)}>
                                  <label>
                                    Calificacion
                                    <select value={review.rating} onChange={(event) => updateReviewForm(reviewKey, { rating: event.target.value })}>
                                      <option value="5">5 estrellas</option>
                                      <option value="4">4 estrellas</option>
                                      <option value="3">3 estrellas</option>
                                      <option value="2">2 estrellas</option>
                                      <option value="1">1 estrella</option>
                                    </select>
                                  </label>
                                  <label>
                                    Tu reseña
                                    <textarea
                                      rows="3"
                                      value={review.comentario}
                                      onChange={(event) => updateReviewForm(reviewKey, { comentario: event.target.value })}
                                      placeholder="Escribe tu experiencia con este producto"
                                    />
                                  </label>
                                  <button type="submit" className="button button--primary" disabled={saving}>
                                    {saving ? "Publicando..." : "Publicar reseña"}
                                  </button>
                                </form>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                  {isOrderPendingPayment(order) && !["cancelado", "cancelled", "canceled"].includes(String(order.estado || "").toLowerCase()) && (
                    <div className="form-inline">
                      <label>
                        Forma de pago
                        <select
                          value={resolveProviderForOrder(order)}
                          onChange={(event) =>
                            setOrderProviders((current) => ({
                              ...current,
                              [order.id]: event.target.value
                            }))
                          }
                        >
                          <option value="mercadopago">Mercado Pago</option>
                          <option value="paypal">PayPal</option>
                          <option value="stripe">Tarjeta</option>
                        </select>
                      </label>
                      <button type="button" className="button button--primary" onClick={() => retryPayment(order)}>
                        Reintentar pago
                      </button>
                    </div>
                  )}
                  {order.cancelable && (
                    <button type="button" className="button button--ghost" onClick={() => cancelOrder(order.id)}>
                      Cancelar pedido
                    </button>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Favoritos</p>
                <h2>Tu wishlist</h2>
              </div>
            </div>
            <div className="list-stack">
              {dashboard.historial.favoritos.length ? (
                dashboard.historial.favoritos.map((item) => (
                  <article key={item.id} className="mini-item mini-item--product">
                    <img src={item.imagenes?.[0]} alt={item.nombre} />
                    <div>
                      <strong>{item.nombre}</strong>
                      <span>{item.categoria}</span>
                    </div>
                    <button type="button" className="button button--ghost" onClick={() => toggleFavorite(item.id, true)}>
                      Quitar
                    </button>
                  </article>
                ))
              ) : (
                <p className="muted-text">Todavia no guardas favoritos.</p>
              )}
            </div>
          </section>

          <section className="section-card">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Actividad</p>
                <h2>Busquedas y productos vistos</h2>
              </div>
            </div>
            <div className="list-stack">
              {dashboard.historial.busquedas.map((item) => (
                <article key={item.id} className="mini-item">
                  <strong>{item.busqueda}</strong>
                  <small>{new Date(item.fecha).toLocaleString()}</small>
                </article>
              ))}
              {dashboard.historial.productosVistos.map((item) => (
                <article key={item.id} className="mini-item">
                  <Link to={`/producto/${item.producto.slug}`}>{item.producto.nombre}</Link>
                  <small>{new Date(item.fecha).toLocaleString()}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
