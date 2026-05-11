import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/");
    } catch (submitError) {
      setMessage(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    try {
      const payload = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email: forgotEmail || form.email }
      });
      setMessage(payload.resetToken ? `Token de prueba generado: ${payload.resetToken}` : payload.message);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="section-label">Acceso seguro</p>
        <h1>Entra a tu cuenta para seguir comprando con historial, carrito y pedidos guardados.</h1>
        <p>La sesion queda protegida y preparada para administrar compras, favoritos y seguimiento.</p>
      </div>

      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Iniciar sesion</h2>
        <label>
          Correo
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
        </label>
        <label>
          Contrasena
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </label>
        <label>
          Recuperar contrasena
          <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder="Correo para recuperacion" />
        </label>
        {message && <p className="inline-message">{message}</p>}
        <div className="action-row">
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
          <button type="button" className="button button--ghost" onClick={requestReset}>
            Recuperar acceso
          </button>
        </div>
        <p className="muted-text">
          No tienes cuenta? <Link to="/register">Creala aqui</Link>
        </p>
      </form>
    </section>
  );
}
