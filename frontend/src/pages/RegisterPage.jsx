import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(form);
      navigate("/");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="section-label">Crear cuenta</p>
        <h1>Abre tu perfil para comprar, guardar historial y usar soporte.</h1>
        <p>Tu cuenta queda preparada para carrito, checkout, seguimiento y futuras compras.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Registro</h2>
        <label>
          Nombre
          <input
            type="text"
            value={form.nombre}
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
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
        {error && <p className="inline-message inline-message--error">{error}</p>}
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
