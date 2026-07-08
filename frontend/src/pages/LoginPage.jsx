import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

function EyeIcon({ visible }) {
  return <span aria-hidden="true">{visible ? "\u{1F648}" : "\u{1F441}\uFE0F"}</span>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({ code: "", password: "", confirmPassword: "" });
  const [resetStep, setResetStep] = useState("request");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const recoveryEmail = (forgotEmail || form.email).trim().toLowerCase();

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
        body: { email: recoveryEmail }
      });
      const fallbackCode = String(payload.resetCode || "");
      setResetForm({ code: /^\d{6}$/.test(fallbackCode) ? fallbackCode : "", password: "", confirmPassword: "" });
      setResetStep("code");
      setMessage(payload.emailSent ? payload.message : `${payload.message} Codigo: ${fallbackCode}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyResetCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = await apiFetch("/auth/verify-reset-code", {
        method: "POST",
        body: { email: recoveryEmail, code: resetForm.code }
      });
      setResetStep("password");
      setMessage(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();

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
          email: recoveryEmail,
          code: resetForm.code,
          password: resetForm.password
        }
      });
      setForm((current) => ({ ...current, email: recoveryEmail, password: "" }));
      setForgotEmail("");
      setResetForm({ code: "", password: "", confirmPassword: "" });
      setResetStep("request");
      setMessage(payload.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeRecoveryModal = () => {
    if (loading) {
      return;
    }
    setResetStep("request");
    setResetForm({ code: "", password: "", confirmPassword: "" });
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
                <EyeIcon visible={showLoginPassword} />
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
          <p className="muted-text">Te enviaremos un codigo a tu correo para validar que la cuenta es tuya.</p>
          <label>
            Correo de recuperacion
            <input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} placeholder="correo@ejemplo.com" />
          </label>
          <button type="button" className="button button--ghost" onClick={requestReset} disabled={loading}>
            {loading ? "Enviando codigo..." : "Enviar codigo"}
          </button>
        </details>

        <p className="muted-text">
          No tienes cuenta? <Link to="/register">Creala aqui</Link>
        </p>
      </div>

      {resetStep === "code" ? (
        <div className="modal-overlay">
          <form className="auth-card auth-card--modal reset-password-form" onSubmit={verifyResetCode}>
            <button type="button" className="modal-close" onClick={closeRecoveryModal} aria-label="Cerrar">
              x
            </button>
            <p className="section-label">Recuperar acceso</p>
            <h2>Ingresa el codigo de tu correo</h2>
            <p className="muted-text">Enviamos un codigo de 6 digitos a <strong>{recoveryEmail}</strong>. Escríbelo para continuar.</p>
            <label>
              Codigo de recuperacion
              <input
                value={resetForm.code}
                onChange={(event) => setResetForm((current) => ({ ...current, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                autoFocus
                required
              />
            </label>
            <div className="action-row">
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? "Validando..." : "Validar codigo"}
              </button>
              <button type="button" className="button button--ghost" onClick={requestReset} disabled={loading}>
                Reenviar codigo
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {resetStep === "password" ? (
        <div className="modal-overlay">
          <form className="auth-card auth-card--modal reset-password-form" onSubmit={submitReset}>
            <button type="button" className="modal-close" onClick={closeRecoveryModal} aria-label="Cerrar">
              x
            </button>
            <p className="section-label">Codigo validado</p>
            <h2>Ingresa tu nueva contrasena</h2>
            <p className="muted-text">Usa una contrasena segura de al menos 8 caracteres.</p>
            <label>
              Nueva contrasena
              <span className="password-field">
                <input type={showResetPassword ? "text" : "password"} value={resetForm.password} onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))} minLength={8} autoFocus required />
                <button type="button" className="password-eye" onClick={() => setShowResetPassword((current) => !current)} aria-label={showResetPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                  <EyeIcon visible={showResetPassword} />
                </button>
              </span>
            </label>
            <label>
              Confirmar contrasena
              <span className="password-field">
                <input type={showResetConfirmPassword ? "text" : "password"} value={resetForm.confirmPassword} onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))} minLength={8} required />
                <button type="button" className="password-eye" onClick={() => setShowResetConfirmPassword((current) => !current)} aria-label={showResetConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                  <EyeIcon visible={showResetConfirmPassword} />
                </button>
              </span>
            </label>
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? "Actualizando..." : "Cambiar contrasena"}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
