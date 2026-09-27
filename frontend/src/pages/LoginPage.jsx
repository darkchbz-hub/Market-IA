import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function EyeIcon({ visible }) {
  return <span aria-hidden="true">{visible ? "\u{1F648}" : "\u{1F441}\uFE0F"}</span>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
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

  return (
    <section className="auth-layout auth-layout--halloween auth-layout--login">
      <div className="auth-copy">
        <Link to="/" className="auth-back-home">← Volver a la tienda</Link>
        <div className="auth-season-badge"><span>✦</span> Temporada Halloween</div>
        <div className="auth-logo-lockup">
          <img src="/assets/gray-c-shop-logo.png?v=20260514-2" alt="Gray C Shop" />
          <span><strong>Gray C Shop</strong><small>Acceso privado a tu experiencia</small></span>
        </div>
        <p className="section-label">Tu cuenta te estaba esperando</p>
        <h1>Regresa a una noche llena de ofertas.</h1>
        <p>Entra para recuperar tu carrito, consultar pedidos y comprar con toda la seguridad de Gray C Shop.</p>
        <div className="auth-benefit-list"><span>✓ Compra protegida</span><span>✓ Historial y seguimiento</span><span>✓ Beneficios para miembros</span></div>
        <div className="auth-night-scene" aria-hidden="true"><span>☾</span><i>🦇</i><b>✦</b></div>
      </div>

      <div className="auth-card auth-card--login">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="auth-card__eyebrow">Bienvenido de vuelta</div>
          <h2>Iniciar sesion</h2>
          <p className="auth-card__intro">Ingresa tus datos para continuar con tus compras.</p>
          <label>Correo
            <input type="email" placeholder="tuusuario@gmail.com" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label>Contrasena
            <span className="password-field">
              <input type={showLoginPassword ? "text" : "password"} placeholder="Tu contraseña" autoComplete="current-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
              <button type="button" className="password-eye" onClick={() => setShowLoginPassword((current) => !current)} aria-label={showLoginPassword ? "Ocultar contrasena" : "Mostrar contrasena"}><EyeIcon visible={showLoginPassword} /></button>
            </span>
          </label>
          {message && <p className="inline-message">{message}</p>}
          <button type="submit" className="button button--primary login-submit" disabled={loading}>{loading ? <><span className="button-spinner" aria-hidden="true" />Entrando...</> : "Entrar"}</button>
        </form>

        <div className="auth-text-links">
          <Link className="auth-recovery-link" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          <p className="muted-text auth-switch-link">¿Aún no tienes cuenta? <Link to="/register">Crear cuenta</Link></p>
        </div>
      </div>
    </section>
  );
}
