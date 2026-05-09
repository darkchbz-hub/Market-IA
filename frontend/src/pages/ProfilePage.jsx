import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

const initialAddress = {
  calle: "",
  ciudad: "",
  estado: "",
  cp: "",
  pais: "Mexico"
};

export function ProfilePage() {
  const { token, refreshUser, isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState(null);
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
            Foto de perfil (URL o data URL)
            <input value={form.avatarUrl} onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))} />
          </label>

          <div className="form-grid form-grid--wide">
            <label>
              Calle
              <input
                value={form.direccion.calle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, direccion: { ...current.direccion, calle: event.target.value } }))
                }
              />
            </label>
            <label>
              Ciudad
              <input
                value={form.direccion.ciudad}
                onChange={(event) =>
                  setForm((current) => ({ ...current, direccion: { ...current.direccion, ciudad: event.target.value } }))
                }
              />
            </label>
            <label>
              Estado
              <input
                value={form.direccion.estado}
                onChange={(event) =>
                  setForm((current) => ({ ...current, direccion: { ...current.direccion, estado: event.target.value } }))
                }
              />
            </label>
            <label>
              Codigo postal
              <input
                value={form.direccion.cp}
                onChange={(event) =>
                  setForm((current) => ({ ...current, direccion: { ...current.direccion, cp: event.target.value } }))
                }
              />
            </label>
          </div>

          <label>
            Pais
            <input
              value={form.direccion.pais}
              onChange={(event) =>
                setForm((current) => ({ ...current, direccion: { ...current.direccion, pais: event.target.value } }))
              }
            />
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
                    <span>{order.estado}</span>
                  </div>
                  <small>{new Date(order.fecha).toLocaleString()}</small>
                  <p>Metodo: {order.metodoPago || "Por definir"} · Total: ${order.total.toFixed(2)}</p>
                  <p>Entrega estimada: {order.fechaEstimada ? new Date(order.fechaEstimada).toLocaleDateString() : "Por definir"}</p>
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
