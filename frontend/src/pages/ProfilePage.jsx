import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

const initialAddress = {
  calle: "",
  ciudad: "",
  estado: "",
  cp: "",
  pais: "MX"
};

export function ProfilePage() {
  const { token, refreshUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    direccion: initialAddress
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    apiFetch("/users/me", { token })
      .then((payload) => {
        if (!active) {
          return;
        }

        setDashboard(payload);
        setForm({
          nombre: payload.user.nombre || "",
          email: payload.user.email || "",
          direccion: {
            ...initialAddress,
            ...(payload.user.direccion || {})
          }
        });
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
      const payload = await apiFetch("/users/me", { token });
      setDashboard(payload);
      setMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loader">Cargando perfil...</div>;
  }

  return (
    <div className="page-section page-section--spaced">
      <section className="profile-layout">
        <form className="card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <p className="section-label">Perfil</p>
              <h2>Datos de tu cuenta</h2>
            </div>
          </div>

          <label>
            Nombre
            <input
              type="text"
              value={form.nombre}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <div className="form-grid">
            <label>
              Calle
              <input
                type="text"
                value={form.direccion.calle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    direccion: { ...current.direccion, calle: event.target.value }
                  }))
                }
              />
            </label>
            <label>
              Ciudad
              <input
                type="text"
                value={form.direccion.ciudad}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    direccion: { ...current.direccion, ciudad: event.target.value }
                  }))
                }
              />
            </label>
            <label>
              Estado
              <input
                type="text"
                value={form.direccion.estado}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    direccion: { ...current.direccion, estado: event.target.value }
                  }))
                }
              />
            </label>
            <label>
              Codigo postal
              <input
                type="text"
                value={form.direccion.cp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    direccion: { ...current.direccion, cp: event.target.value }
                  }))
                }
              />
            </label>
          </div>

          <label>
            Pais
            <input
              type="text"
              value={form.direccion.pais}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  direccion: { ...current.direccion, pais: event.target.value }
                }))
              }
            />
          </label>

          {message && <p className="inline-message">{message}</p>}
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        <div className="history-column">
          <section className="card">
            <div className="section-header">
              <div>
                <p className="section-label">Ordenes</p>
                <h2>Compras recientes</h2>
              </div>
            </div>
            <div className="list-stack">
              {dashboard?.historial.ordenes.length ? (
                dashboard.historial.ordenes.map((order) => (
                  <article key={order.id} className="mini-item">
                    <strong>{order.id.slice(0, 8)}</strong>
                    <span>{order.estado}</span>
                    <span>${order.total.toFixed(2)}</span>
                  </article>
                ))
              ) : (
                <p className="muted-text">Todavia no tienes ordenes.</p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="section-header">
              <div>
                <p className="section-label">Busquedas</p>
                <h2>Ultimas consultas</h2>
              </div>
            </div>
            <div className="list-stack">
              {dashboard?.historial.busquedas.length ? (
                dashboard.historial.busquedas.map((item) => (
                  <article key={item.id} className="mini-item">
                    <strong>{item.busqueda}</strong>
                    <span>{new Date(item.fecha).toLocaleString()}</span>
                  </article>
                ))
              ) : (
                <p className="muted-text">Aun no hay busquedas registradas.</p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="section-header">
              <div>
                <p className="section-label">Productos vistos</p>
                <h2>Actividad reciente</h2>
              </div>
            </div>
            <div className="list-stack">
              {dashboard?.historial.productosVistos.length ? (
                dashboard.historial.productosVistos.map((item) => (
                  <article key={item.id} className="mini-item">
                    <strong>{item.producto.nombre}</strong>
                    <span>{new Date(item.fecha).toLocaleString()}</span>
                  </article>
                ))
              ) : (
                <p className="muted-text">Aun no has visto productos.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
