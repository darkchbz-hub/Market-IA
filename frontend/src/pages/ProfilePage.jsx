import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";
import {
  INTERNATIONAL_CHECKOUT_MESSAGE,
  INTERNATIONAL_SHIPPING_MESSAGE,
  buildOrderSupportWhatsappUrl,
  isMexicoCountry
} from "../lib/shipping.js";

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
  const [showReviewThanks, setShowReviewThanks] = useState(false);
  const [activeSection, setActiveSection] = useState("resumen");
  const profileContentRef = useRef(null);

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

  useEffect(() => {
    if (!showReviewThanks) return undefined;
    const timer = window.setTimeout(() => setShowReviewThanks(false), 4800);
    return () => window.clearTimeout(timer);
  }, [showReviewThanks]);

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
    return reviewForms[key] || { rating: "5", comentario: "", imagenes: [] };
  };

  const updateReviewForm = (key, nextValues) => {
    setReviewForms((current) => ({
      ...current,
      [key]: {
        ...(current[key] || { rating: "5", comentario: "", imagenes: [] }),
        ...nextValues
      }
    }));
  };

  const appendReviewImages = async (key, files) => {
    const images = await Promise.all(
      Array.from(files || [])
        .filter((file) => file.type?.startsWith("image/"))
        .slice(0, 6)
        .map(fileToDataUrl)
    );

    if (!images.length) {
      setMessage("Selecciona imagenes validas para tu reseña.");
      return;
    }

    const currentReview = getReviewForm(key);
    updateReviewForm(key, { imagenes: [...(currentReview.imagenes || []), ...images].slice(0, 6) });
  };

  const uploadPaymentReceipt = async (order, file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/") && file.type !== "application/pdf") {
      setMessage("El comprobante debe ser una imagen o PDF.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage("El comprobante no puede superar 4 MB.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const dataUrl = await fileToDataUrl(file);
      await apiFetch(`/orders/${order.id}/receipt`, { method: "POST", token, body: { dataUrl, name: file.name, type: file.type } });
      await loadDashboard();
      setMessage("Comprobante enviado. El administrador lo revisará antes de liberar tu factura.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
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
          comentario: review.comentario,
          imagenes: review.imagenes || []
        }
      });

      setReviewForms((current) => ({
        ...current,
        [key]: { rating: "5", comentario: "", imagenes: [] }
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
      setShowReviewThanks(true);
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

  const orders = dashboard.historial?.ordenes || [];
  const favorites = dashboard.historial?.favoritos || [];
  const searches = dashboard.historial?.busquedas || [];
  const viewedProducts = dashboard.historial?.productosVistos || [];
  const profileName = dashboard.user?.nombre || form.nombre || "Cliente Gray C Shop";
  const profileInitial = profileName.trim().slice(0, 1).toUpperCase() || "G";
  const paidOrders = orders.filter((order) => ["paid", "pagado"].includes(String(order.estado || "").toLowerCase())).length;
  const selectSection = (section) => {
    setActiveSection(section);
    if (window.matchMedia("(max-width: 800px)").matches) {
      window.requestAnimationFrame(() => profileContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <div className="page-stack profile-page">
      {showReviewThanks && (
        <div className="review-thanks" role="status" aria-live="polite">
          <button type="button" className="review-thanks__close" onClick={() => setShowReviewThanks(false)} aria-label="Cerrar agradecimiento">×</button>
          <div className="review-thanks__sparkles" aria-hidden="true"><span>✦</span><span>★</span><span>✦</span></div>
          <img src="/assets/review-tigresa.png" alt="Tigresa, la gatita de Gray C Shop" />
          <div>
            <small>Tigresa dice</small>
            <strong>¡Gracias por tu comentario!</strong>
            <p>Tu opinión ayuda a otros clientes a elegir mejor.</p>
          </div>
        </div>
      )}
      <header className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-hero__avatar">
            {form.avatarUrl ? <img src={form.avatarUrl} alt={`Foto de ${profileName}`} /> : <span>{profileInitial}</span>}
          </div>
          <div>
            <p className="section-label">Mi cuenta Gray C Shop</p>
            <h1>Hola, {profileName}</h1>
            <p>{dashboard.user?.email || form.email} · @{dashboard.user?.nickname || form.nickname || "cliente"}</p>
          </div>
        </div>
        <div className="profile-hero__metrics">
          <div><strong>{orders.length}</strong><span>Pedidos</span></div>
          <div><strong>{paidOrders}</strong><span>Compras pagadas</span></div>
          <div><strong>{favorites.length}</strong><span>Favoritos</span></div>
        </div>
      </header>

      <div className="profile-dashboard">
        <aside className="profile-sidebar" aria-label="Secciones del perfil">
          <div className="profile-sidebar__title"><span>☾</span><div><strong>Centro de cuenta</strong><small>Todo en orden</small></div></div>
          {[
            ["resumen", "⌂", "Resumen", "Vista general"],
            ["datos", "♙", "Mi información", "Datos y dirección"],
            ["pedidos", "▣", "Mis pedidos", `${orders.length} registrados`],
            ["favoritos", "♡", "Favoritos", `${favorites.length} guardados`],
            ["actividad", "⌁", "Actividad", "Búsquedas y vistos"]
          ].map(([id, icon, label, hint]) => (
            <button type="button" key={id} className={activeSection === id ? "is-active" : ""} onClick={() => selectSection(id)}>
              <span className="profile-sidebar__icon">{icon}</span><span><strong>{label}</strong><small>{hint}</small></span><b>›</b>
            </button>
          ))}
          {isAdmin && <Link to="/admin" className="profile-sidebar__admin">Panel administrador ↗</Link>}
        </aside>

        <section ref={profileContentRef} className={`section-card profile-dashboard__panel profile-overview${activeSection === "resumen" ? " is-active" : ""}`}>
          <div className="section-heading"><div><p className="section-label">Resumen</p><h2>Tu cuenta de un vistazo</h2></div></div>
          <div className="profile-overview__grid">
            <button type="button" onClick={() => selectSection("pedidos")}><span>▣</span><div><strong>{orders.length ? `Tienes ${orders.length} pedido${orders.length === 1 ? "" : "s"}` : "Sin pedidos todavía"}</strong><small>{orders.length ? "Consulta pagos, envíos y reseñas" : "Tu próxima compra aparecerá aquí"}</small></div><b>Ver pedidos →</b></button>
            <button type="button" onClick={() => selectSection("favoritos")}><span>♡</span><div><strong>{favorites.length ? `${favorites.length} producto${favorites.length === 1 ? "" : "s"} guardado${favorites.length === 1 ? "" : "s"}` : "Tu lista está esperando"}</strong><small>Guarda productos para encontrarlos rápido</small></div><b>Ver favoritos →</b></button>
            <button type="button" onClick={() => selectSection("datos")}><span>♙</span><div><strong>Información personal</strong><small>Actualiza tus datos, foto y domicilio</small></div><b>Editar perfil →</b></button>
          </div>
          <div className="profile-overview__recent">
            <div><p className="section-label">Último movimiento</p><h3>{orders[0] ? `Pedido ${orders[0].id.slice(0, 8)}` : "Aún no hay movimientos"}</h3><p>{orders[0] ? `${new Date(orders[0].fecha).toLocaleDateString("es-MX")} · $${orders[0].total.toFixed(2)}` : "Explora el catálogo y encuentra algo especial."}</p></div>
            <Link to="/catalogo" className="button button--primary">Explorar catálogo</Link>
          </div>
        </section>

        <form className={`section-card profile-dashboard__panel profile-edit-form${activeSection === "datos" ? " is-active" : ""}`} onSubmit={handleSubmit}>
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

        <div className="profile-dashboard__sections">
          <section className={`section-card profile-dashboard__panel profile-orders${activeSection === "pedidos" ? " is-active" : ""}`}>
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Tus compras</p>
                <h2>Historial de pedidos</h2>
              </div>
            </div>
            <div className="list-stack">
              {orders.length ? orders.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card__head">
                    <strong>{order.id.slice(0, 8)}</strong>
                    <span className={statusClass(order.estado)}>{statusLabel(order.estado)}</span>
                  </div>
                  <small>{new Date(order.fecha).toLocaleString()}</small>
                  <p>Metodo: {order.metodoPago || "Por definir"} · Total: ${order.total.toFixed(2)}</p>
                  <div className="order-documents">
                    {order.receiptName ? (
                      <div className="order-document-status is-ready"><span>✓</span><div><strong>Comprobante enviado</strong><small>{order.receiptName} · En revisión</small></div></div>
                    ) : order.receiptUploadEnabled && !["cancelled", "canceled", "cancelado"].includes(String(order.estado || "").toLowerCase()) ? (
                      <label className="button button--ghost order-receipt-upload">
                        Subir comprobante
                        <input type="file" accept="image/*,application/pdf" disabled={saving} onChange={async (event) => { await uploadPaymentReceipt(order, event.target.files?.[0]); event.target.value = ""; }} />
                      </label>
                    ) : (
                      <div className="order-document-status"><span>⌛</span><div><strong>Comprobante cerrado</strong><small>Contacta a soporte si necesitas reemplazarlo.</small></div></div>
                    )}
                    {["paid", "pagado"].includes(String(order.estado || "").toLowerCase()) && order.invoiceEnabled ? (
                      <Link to={`/factura/${order.id}`} className="button button--primary">Descargar factura</Link>
                    ) : (
                      <span className="invoice-locked">🔒 Factura disponible después de confirmar el pago</span>
                    )}
                  </div>
                  {!isMexicoCountry(order.direccionEnvio?.pais || order.direccion?.pais) && (
                    <div className="shipping-support-card">
                      <strong>{INTERNATIONAL_SHIPPING_MESSAGE}</strong>
                      <span>{INTERNATIONAL_CHECKOUT_MESSAGE}</span>
                      <a className="button button--primary" href={buildOrderSupportWhatsappUrl(order)} target="_blank" rel="noreferrer">
                        Soporte
                      </a>
                    </div>
                  )}
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
                                {item.variante?.color?.nombre && (
                                  <span className="cart-item__variant">
                                    Color: <span style={{ background: item.variante.color.hex || "#cbd5e1" }} /> {item.variante.color.nombre}
                                  </span>
                                )}
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
                                  <label>
                                    Fotos del producto recibido
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={async (event) => {
                                        await appendReviewImages(reviewKey, event.target.files);
                                        event.target.value = "";
                                      }}
                                    />
                                  </label>
                                  {review.imagenes?.length > 0 && (
                                    <div className="review-image-grid review-image-grid--editable">
                                      {review.imagenes.map((image, index) => (
                                        <div key={`${image}-${index}`} className="admin-image-preview">
                                          <img src={image} alt={`Foto reseña ${index + 1}`} />
                                          <button
                                            type="button"
                                            className="admin-image-preview__remove"
                                            onClick={() => updateReviewForm(reviewKey, { imagenes: (review.imagenes || []).filter((_, imageIndex) => imageIndex !== index) })}
                                            aria-label="Quitar imagen"
                                          >
                                            x
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
              )) : <div className="profile-empty-state"><span>▣</span><strong>Aún no tienes pedidos</strong><p>Cuando realices una compra podrás seguirla desde aquí.</p><Link to="/catalogo" className="button button--primary">Explorar productos</Link></div>}
            </div>
          </section>

          <section className={`section-card profile-dashboard__panel profile-favorites${activeSection === "favoritos" ? " is-active" : ""}`}>
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Favoritos</p>
                <h2>Tu wishlist</h2>
              </div>
            </div>
            <div className="list-stack">
              {favorites.length ? (
                favorites.map((item) => (
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
                <div className="profile-empty-state"><span>♡</span><strong>Tu wishlist está vacía</strong><p>Guarda los productos que te gustan para encontrarlos después.</p><Link to="/catalogo" className="button button--primary">Descubrir productos</Link></div>
              )}
            </div>
          </section>

          <section className={`section-card profile-dashboard__panel profile-activity${activeSection === "actividad" ? " is-active" : ""}`}>
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-label">Actividad</p>
                <h2>Busquedas y productos vistos</h2>
              </div>
            </div>
            <div className="list-stack">
              {searches.map((item) => (
                <article key={item.id} className="mini-item">
                  <strong>{item.busqueda}</strong>
                  <small>{new Date(item.fecha).toLocaleString()}</small>
                </article>
              ))}
              {viewedProducts.map((item) => (
                <article key={item.id} className="mini-item">
                  <Link to={`/producto/${item.producto.slug}`}>{item.producto.nombre}</Link>
                  <small>{new Date(item.fecha).toLocaleString()}</small>
                </article>
              ))}
              {!searches.length && !viewedProducts.length && <div className="profile-empty-state"><span>⌁</span><strong>Sin actividad reciente</strong><p>Tus búsquedas y productos visitados aparecerán en este espacio.</p></div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
