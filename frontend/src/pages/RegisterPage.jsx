import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    nickname: "",
    invitationCode: "",
    password: "",
    direccion: {
      calle: "",
      ciudad: "",
      estado: "",
      cp: "",
      pais: "Mexico"
    },
    acceptedTerms: false
  });
  const [step, setStep] = useState("form");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await apiFetch("/auth/register/send-code", {
        method: "POST",
        body: form
      });
      setStep("verify");
      setMessage("Te enviamos un codigo de verificacion a tu correo.");
    } catch (submitError) {
      setMessage(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await apiFetch("/auth/register/verify-code", {
        method: "POST",
        body: {
          email: form.email,
          code
        }
      });
      await login({ email: form.email, password: form.password });
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

      {step === "form" ? (
      <form className="auth-card" onSubmit={handleSendCode}>
        <h2>Registro</h2>
        <div className="form-grid form-grid--wide">
          <label>
            Nombre
            <input value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} required />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              pattern={"^[^\\s@]+@gmail\\.com$"}
              title="Solo se aceptan correos @gmail.com"
              required
            />
          </label>
          <label>
            Telefono
            <input value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} required />
          </label>
          <label>
            Nickname
            <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} required />
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

        <label>
          Codigo de invitacion (6 digitos)
          <input
            value={form.invitationCode}
            onChange={(event) => setForm((current) => ({ ...current, invitationCode: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
            minLength={6}
            maxLength={6}
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
              required
            />
          </label>
          <label>
            Ciudad
            <input
              value={form.direccion.ciudad}
              onChange={(event) =>
                setForm((current) => ({ ...current, direccion: { ...current.direccion, ciudad: event.target.value } }))
              }
              required
            />
          </label>
          <label>
            Estado
            <input
              value={form.direccion.estado}
              onChange={(event) =>
                setForm((current) => ({ ...current, direccion: { ...current.direccion, estado: event.target.value } }))
              }
              required
            />
          </label>
          <label>
            Codigo postal
            <input
              value={form.direccion.cp}
              onChange={(event) =>
                setForm((current) => ({ ...current, direccion: { ...current.direccion, cp: event.target.value } }))
              }
              required
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
            required
          />
        </label>

        <label className="checkbox-chip">
          <input
            type="checkbox"
            checked={Boolean(form.acceptedTerms)}
            onChange={(event) => setForm((current) => ({ ...current, acceptedTerms: event.target.checked }))}
            required
          />
          Acepto los <Link to="/terminos">Terminos y Condiciones de Gray C Shop</Link>
        </label>

        {message && <p className="inline-message">{message}</p>}
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? "Enviando..." : "Enviar codigo"}
        </button>
        <p className="muted-text">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </form>
      ) : (
      <form className="auth-card" onSubmit={handleVerifyCode}>
        <h2>Verifica tu correo</h2>
        <p className="muted-text">
          Te enviamos un codigo de 6 digitos a <strong>{form.email}</strong>.
        </p>
        <label>
          Codigo de verificacion
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            minLength={6}
            maxLength={6}
            required
          />
        </label>
        {message && <p className="inline-message">{message}</p>}
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? "Validando..." : "Validar codigo y crear cuenta"}
        </button>
        <button type="button" className="button button--ghost" onClick={() => setStep("form")} disabled={loading}>
          Cambiar datos
        </button>
      </form>
      )}
    </section>
  );
}
