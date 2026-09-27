import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";

function EyeIcon({ visible }) {
  return <span aria-hidden="true">{visible ? "\u{1F648}" : "\u{1F441}\uFE0F"}</span>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetForm, setResetForm] = useState({ code: "", password: "", confirmPassword: "" });
  const [step, setStep] = useState("request");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const recoveryEmail = email.trim().toLowerCase();

  const requestReset = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = await apiFetch("/auth/forgot-password", { method: "POST", body: { email: recoveryEmail } });
      const fallbackCode = String(payload.resetCode || "");
      setResetForm({ code: /^\d{6}$/.test(fallbackCode) ? fallbackCode : "", password: "", confirmPassword: "" });
      setStep("code");
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
      const payload = await apiFetch("/auth/verify-reset-code", { method: "POST", body: { email: recoveryEmail, code: resetForm.code } });
      setStep("password");
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
        body: { email: recoveryEmail, code: resetForm.code, password: resetForm.password }
      });
      setMessage(payload.message);
      setStep("complete");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    if (loading) return;
    setStep("request");
    setResetForm({ code: "", password: "", confirmPassword: "" });
    setMessage("");
  };

  return (
    <section className="auth-layout auth-layout--halloween auth-layout--recovery">
      <div className="auth-copy">
        <Link to="/login" className="auth-back-home">← Volver a iniciar sesión</Link>
        <div className="auth-season-badge"><span>✦</span> Recuperación segura</div>
        <div className="auth-logo-lockup">
          <img src="/assets/gray-c-shop-logo.png?v=20260514-2" alt="Gray C Shop" />
          <span><strong>Gray C Shop</strong><small>Protegemos el acceso a tu cuenta</small></span>
        </div>
        <p className="section-label">No estás perdido</p>
        <h1>Encuentra el camino de regreso.</h1>
        <p>Te enviaremos un código privado para confirmar que la cuenta es tuya y elegir una nueva contraseña.</p>
        <div className="auth-benefit-list"><span>✓ Código de un solo uso</span><span>✓ Verificación por correo</span><span>✓ Contraseña renovada</span></div>
        <div className="auth-night-scene" aria-hidden="true"><span>☾</span><i>🦇</i><b>✦</b></div>
      </div>

      <div className="auth-card auth-card--recovery">
        {step === "complete" ? (
          <div className="auth-complete-state">
            <div className="auth-complete-state__icon">✓</div>
            <div className="auth-card__eyebrow">Acceso recuperado</div>
            <h2>Tu contraseña fue actualizada</h2>
            <p className="auth-card__intro">Ya puedes entrar nuevamente con tu nueva contraseña.</p>
            {message && <p className="inline-message">{message}</p>}
            <Link to="/login" className="button button--primary">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={requestReset}>
            <div className="auth-card__eyebrow">Recuperar cuenta</div>
            <h2>Olvidé mi contraseña</h2>
            <p className="auth-card__intro">Escribe el correo registrado en tu cuenta.</p>
            <label>Correo de recuperación
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tuusuario@gmail.com" autoComplete="email" required />
            </label>
            {message && <p className="inline-message">{message}</p>}
            <button type="submit" className="button button--primary login-submit" disabled={loading}>{loading ? "Enviando código..." : "Enviar código"}</button>
            <p className="muted-text auth-switch-link">¿Recordaste tu contraseña? <Link to="/login">Iniciar sesión</Link></p>
          </form>
        )}
      </div>

      {step === "code" && (
        <div className="modal-overlay">
          <form className="auth-card auth-card--modal reset-password-form" onSubmit={verifyResetCode}>
            <button type="button" className="modal-close" onClick={restart} aria-label="Cerrar">×</button>
            <p className="section-label">Correo enviado</p><h2>Ingresa el código</h2>
            <p className="muted-text">Enviamos 6 dígitos a <strong>{recoveryEmail}</strong>.</p>
            <label>Código de recuperación
              <input value={resetForm.code} onChange={(event) => setResetForm((current) => ({ ...current, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))} inputMode="numeric" minLength={6} maxLength={6} autoFocus required />
            </label>
            {message && <p className="inline-message">{message}</p>}
            <div className="action-row"><button className="button button--primary" disabled={loading}>{loading ? "Validando..." : "Validar código"}</button><button type="button" className="button button--ghost" onClick={requestReset} disabled={loading}>Reenviar</button></div>
          </form>
        </div>
      )}

      {step === "password" && (
        <div className="modal-overlay">
          <form className="auth-card auth-card--modal reset-password-form" onSubmit={submitReset}>
            <button type="button" className="modal-close" onClick={restart} aria-label="Cerrar">×</button>
            <p className="section-label">Código validado</p><h2>Crea una nueva contraseña</h2>
            <p className="muted-text">Usa al menos 8 caracteres.</p>
            <label>Nueva contraseña<span className="password-field"><input type={showPassword ? "text" : "password"} value={resetForm.password} onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))} minLength={8} autoFocus required /><button type="button" className="password-eye" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}><EyeIcon visible={showPassword} /></button></span></label>
            <label>Confirmar contraseña<span className="password-field"><input type={showConfirmPassword ? "text" : "password"} value={resetForm.confirmPassword} onChange={(event) => setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))} minLength={8} required /><button type="button" className="password-eye" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}><EyeIcon visible={showConfirmPassword} /></button></span></label>
            {message && <p className="inline-message">{message}</p>}
            <button className="button button--primary" disabled={loading}>{loading ? "Actualizando..." : "Cambiar contraseña"}</button>
          </form>
        </div>
      )}
    </section>
  );
}
