import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    nickname: "",
    password: "",
    direccion: {
      calle: "",
      ciudad: "",
      estado: "",
      cp: "",
      pais: "Mexico"
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await register(form);
      navigate("/");
    } catch (submitError) {
      setMessage(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="section-label">Crear cuenta</p>
        <h1>Abre tu perfil para comprar, guardar favoritos y seguir tus pedidos desde un solo lugar.</h1>
        <p>Tu cuenta queda lista para carrito, historial, reseñas verificadas y administracion segura de datos.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Registro</h2>
        <div className="form-grid form-grid--wide">
          <label>
            Nombre
            <input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} required />
          </label>
          <label>
            Correo
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label>
            Telefono
            <input value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} required />
          </label>
          <label>
            Nickname
            <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} />
          </label>
        </div>

        <label>
          Contrasena
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            minLength={8}
            required
          />
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
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <p className="muted-text">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </form>
    </section>
  );
}
