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
  const [resetForm, setResetForm] = useState({ code: "", password: "", confirmPassword: "" });
  const [resetRequested, setResetRequested] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
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
    setLoading(true);
    setMessage("");

    try {
      const payload = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email: forgotEmail || form.email }
      });
      const fallbackCode = String(payload.resetCode || "");
      setResetRequested(true);
      setResetForm((current) => ({
        ...current,
        code: /^\d{6}$/.test(fallbackCode) ? fallbackCode : ""
      }));
      setMessage(payload.emailSent ? payload.message : `${payload.message} Codigo: ${fallbackCode}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    const email = forgotEmail || form.email;

    if (resetForm.password !== resetForm.confirmPassword) {
      setMessage("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: {
          email,
          code: resetForm.code,
          password: resetForm.password
        }
      });
      setForm((current) => ({ ...current, email, password: "" }));
      setResetForm({ code: "", password: "", confirmPassword: "" });
      setResetRequested(false);
      setMessage(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
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
            <span className="password-field">
              <input type={showLoginPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
              <button type="button" className="password-eye" onClick={() => setShowLoginPassword((current) => !current)} aria-label={showLoginPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                {showLoginPassword ? "🙈" : "👁"}
              </button>
            </span>
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
          <button type="button" className="button button--ghost" onClick={requestReset} disabled={loading}>
            {loading ? "Enviando codigo..." : "Enviar codigo"}
          </button>
          {resetRequested && (
            <form className="reset-password-form" onSubmit={submitReset}>
              <p className="muted-text">Ingresa el codigo recibido por correo y escribe tu nueva contrasena.</p>
              <label>
                Codigo de recuperacion
                <input
                  value={resetForm.code}
                  onChange={(event) => setResetForm((current) => ({ ...current, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  inputMode="numeric"
                  minLength={6}
                  maxLength={6}
                  required
                />
              </label>
              <label>
                Nueva contrasena
                <span className="password-field">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={resetForm.password}
                    onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))}
                    minLength={8}
                    required
                  />
                  <button type="button" className="password-eye" onClick={() => setShowResetPassword((current) => !current)} aria-label={showResetPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                    {showResetPassword ? "🙈" : "👁"}
                  </button>
                </span>
              </label>
              <label>
                Confirmar contrasena
                <span className="password-field">
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    value={resetForm.confirmPassword}
                    onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    minLength={8}
                    required
                  />
                  <button type="button" className="password-eye" onClick={() => setShowResetConfirmPassword((current) => !current)} aria-label={showResetConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                    {showResetConfirmPassword ? "🙈" : "👁"}
                  </button>
                </span>
              </label>
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? "Actualizando..." : "Cambiar contrasena"}
              </button>
            </form>
          )}
        </details>

        <p className="muted-text">
          No tienes cuenta? <Link to="/register">Creala aqui</Link>
        </p>
      </div>
    </section>
  );
}
