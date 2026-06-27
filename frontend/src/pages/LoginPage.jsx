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
        <h1>Vuelve a tu cuenta y continua comprando sin perder tu historial.</h1>
        <p>Consulta pedidos, carrito guardado, favoritos y seguimiento desde un acceso seguro.</p>
      </div>

      <div className="auth-card auth-card--login">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Iniciar sesion</h2>
          <label>
            Correo
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label>
            Contrasena
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </label>
          {message && <p className="inline-message">{message}</p>}
          <button type="submit" className="button button--primary login-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <details className="password-recovery-panel">
          <summary>Olvide mi contrasena</summary>
          <p className="muted-text">Te ayudamos a recuperar el acceso con tu correo registrado.</p>
          <label>
            Correo de recuperacion
            <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder="correo@ejemplo.com" />
          </label>
          <button type="button" className="button button--ghost" onClick={requestReset}>
            Recuperar acceso
          </button>
        </details>

        <p className="muted-text">
          No tienes cuenta? <Link to="/register">Creala aqui</Link>
        </p>
      </div>
    </section>
  );
}
