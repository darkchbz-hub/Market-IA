import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="section-label">Bienvenido</p>
        <h1>Entra a tu cuenta para seguir comprando.</h1>
        <p>Recupera tu carrito, tu historial, tus busquedas y tus mensajes de soporte.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Iniciar sesion</h2>
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
            required
          />
        </label>
        {error && <p className="inline-message inline-message--error">{error}</p>}
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="muted-text">
          No tienes cuenta? <Link to="/register">Creala aqui</Link>
        </p>
      </form>
    </section>
  );
}
