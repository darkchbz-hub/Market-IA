import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../lib/api.js";
import { isPostalCodeFormatValid, postalCodeExample } from "../lib/postal-codes.js";

const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

function EyeIcon({ visible }) {
  return <span aria-hidden="true">{visible ? "\u{1F648}" : "\u{1F441}\uFE0F"}</span>;
}

const COUNTRY_CODES = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
  "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
  "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
  "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
  "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
  "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
  "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
  "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
  "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"
];

function getCountryOptions() {
  const formatter = typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["es"], { type: "region" })
    : null;

  const countries = COUNTRY_CODES.map((code) => ({
    code,
    name: formatter?.of(code) || code
  })).sort((a, b) => a.name.localeCompare(b.name, "es"));

  const mexicoIndex = countries.findIndex((item) => item.code === "MX");
  if (mexicoIndex > 0) {
    const [mexico] = countries.splice(mexicoIndex, 1);
    countries.unshift(mexico);
  }

  return countries;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const codeInputRefs = useRef([]);
  const postalLookupRequestIdRef = useRef(0);
  const countries = useMemo(() => getCountryOptions(), []);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    nickname: "",
    invitationCode: "",
    password: "",
    direccion: {
      localidad: "",
      calle: "",
      ciudad: "",
      estado: "",
      cp: "",
      pais: "Mexico"
    },
    acceptedTerms: false
  });
  const [countryCode, setCountryCode] = useState("MX");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationDigits, setVerificationDigits] = useState(["", "", "", "", "", ""]);
  const [verificationState, setVerificationState] = useState("idle");
  const [postalLocalities, setPostalLocalities] = useState([]);
  const [postalVerified, setPostalVerified] = useState(false);
  const [postalLoading, setPostalLoading] = useState(false);
  const [postalMessage, setPostalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const clearResolvedAddress = () => {
    setPostalLocalities([]);
    setPostalVerified(false);
    setForm((current) => ({
      ...current,
      direccion: {
        ...current.direccion,
        estado: "",
        localidad: "",
        ciudad: ""
      }
    }));
  };

  const runPostalLookup = async (postalCode, country = countryCode) => {
    const cleanPostalCode = String(postalCode || "").trim();
    if (cleanPostalCode.length < 3) {
      return;
    }

    if (!isPostalCodeFormatValid(country, cleanPostalCode)) {
      clearResolvedAddress();
      setPostalMessage(`Codigo Postal Incorrecto. Formato esperado: ${postalCodeExample(country)}.`);
      return;
    }

    const requestId = postalLookupRequestIdRef.current + 1;
    postalLookupRequestIdRef.current = requestId;
    setPostalLoading(true);
    setPostalMessage("");

    try {
      const result = await apiFetch(`/geo/postal-lookup?country=${encodeURIComponent(country)}&cp=${encodeURIComponent(cleanPostalCode)}`);
      if (requestId !== postalLookupRequestIdRef.current) {
        return;
      }
      const localities = Array.isArray(result.localities) ? result.localities : [];
      if (!result.found || !localities.length || !result.state || !(result.city || localities[0])) {
        clearResolvedAddress();
        setPostalMessage("Codigo Postal Incorrecto.");
        return;
      }
      const countryName =
        countries.find((item) => item.code === String(result.countryCode || "").toUpperCase())?.name ||
        String(result.country || "").trim() ||
        form.direccion.pais ||
        "Mexico";
      const firstLocality = localities[0] || "";
      const city = String(result.city || firstLocality || "").trim();

      setCountryCode(String(result.countryCode || country).toUpperCase());
      setPostalLocalities(localities);
      setPostalVerified(true);
      setForm((current) => ({
        ...current,
        direccion: {
          ...current.direccion,
          cp: String(result.postalCode || cleanPostalCode),
          pais: countryName,
          estado: String(result.state || ""),
          localidad: firstLocality,
          ciudad: city
        }
      }));
      setPostalMessage("Codigo postal validado.");
    } catch (postalError) {
      if (requestId !== postalLookupRequestIdRef.current) {
        return;
      }
      clearResolvedAddress();
      setPostalMessage(postalError.message || "Codigo Postal Incorrecto.");
    } finally {
      if (requestId === postalLookupRequestIdRef.current) {
        setPostalLoading(false);
      }
    }
  };

  const handleCodeDigitChange = (index, rawValue) => {
    const value = String(rawValue || "").replace(/\D/g, "").slice(-1);

    setVerificationDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    setVerificationState("idle");
    setMessage("");

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === "Backspace" && !verificationDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (event) => {
    event.preventDefault();
    const digits = String(event.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");

    if (!digits.length) {
      return;
    }

    setVerificationDigits((current) => {
      const next = [...current];
      for (let index = 0; index < 6; index += 1) {
        next[index] = digits[index] || "";
      }
      return next;
    });

    const focusIndex = Math.min(digits.length, 6) - 1;
    if (focusIndex >= 0) {
      codeInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSendCode = async (event) => {
    event.preventDefault();

    if (!GMAIL_REGEX.test(form.email)) {
      setMessage("Solo se aceptan correos @gmail.com");
      return;
    }

    if (!postalVerified) {
      setMessage("Codigo Postal Incorrecto.");
      return;
    }

    setLoading(true);
    setMessage("");
    setVerificationState("idle");

    try {
      const response = await apiFetch("/auth/register/send-code", {
        method: "POST",
        body: form
      });
      setShowVerifyModal(true);
      const fallbackCode = String(response.verificationCode || "");
      setVerificationDigits(/^\d{6}$/.test(fallbackCode) ? fallbackCode.split("") : ["", "", "", "", "", ""]);
      setMessage(response.emailSent ? "Te enviamos un codigo de verificacion a tu correo." : `No se pudo enviar el correo automaticamente. Tu codigo es ${fallbackCode}.`);
    } catch (submitError) {
      setMessage(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setMessage("");
    setVerificationState("idle");

    try {
      const response = await apiFetch("/auth/register/send-code", {
        method: "POST",
        body: form
      });
      const fallbackCode = String(response.verificationCode || "");
      setMessage(response.emailSent ? "Te enviamos un nuevo codigo a tu correo." : `No se pudo enviar el correo automaticamente. Tu codigo es ${fallbackCode}.`);
      setVerificationDigits(/^\d{6}$/.test(fallbackCode) ? fallbackCode.split("") : ["", "", "", "", "", ""]);
    } catch (submitError) {
      setMessage(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    const code = verificationDigits.join("");

    if (!/^\d{6}$/.test(code)) {
      setVerificationState("error");
      setMessage("Codigo invalido.");
      return;
    }

    setLoading(true);
    setMessage("");
    setVerificationState("idle");

    try {
      await apiFetch("/auth/register/verify-code", {
        method: "POST",
        body: {
          email: form.email,
          code
        }
      });
      await login({ email: form.email, password: form.password });
      setVerificationState("success");
      setShowVerifyModal(false);
      setShowWelcomeModal(true);
    } catch (submitError) {
      setVerificationState("error");
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
              title="Solo se aceptan correos @gmail.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Telefono
            <input type="tel" autoComplete="tel" value={form.telefono} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} required />
          </label>
          <label>
            Nickname
            <input value={form.nickname} onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))} required />
          </label>
        </div>

        <label>
          Contrasena
          <span className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              minLength={8}
              required
            />
            <button type="button" className="password-eye" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
              <EyeIcon visible={showPassword} />
            </button>
          </span>
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
            Codigo postal
            <input
              inputMode="text"
              placeholder={`Ejemplo: ${postalCodeExample(countryCode)}`}
              value={form.direccion.cp}
              onChange={(event) => {
                setPostalMessage("");
                setPostalLocalities([]);
                setPostalVerified(false);
                setForm((current) => ({
                  ...current,
                  direccion: {
                    ...current.direccion,
                    cp: event.target.value,
                    estado: "",
                    localidad: "",
                    ciudad: ""
                  }
                }));
              }}
              onBlur={(event) => runPostalLookup(event.target.value, countryCode)}
              required
            />
          </label>
          <label>
            Pais
            <select
              value={countryCode}
              onChange={(event) => {
                const nextCode = event.target.value;
                const selectedCountry = countries.find((item) => item.code === nextCode);
                setCountryCode(nextCode);
                setPostalLocalities([]);
                setPostalVerified(false);
                setPostalMessage("");
                setForm((current) => ({
                  ...current,
                  direccion: {
                    ...current.direccion,
                    pais: selectedCountry?.name || current.direccion.pais,
                    estado: "",
                    localidad: "",
                    ciudad: ""
                  }
                }));
                if (form.direccion.cp.trim().length >= 3) {
                  runPostalLookup(form.direccion.cp, nextCode);
                }
              }}
              required
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <input
              value={form.direccion.estado}
              readOnly
              placeholder="Se rellena con el codigo postal"
              required
            />
          </label>
          <label>
            Localidad
            {postalLocalities.length > 1 ? (
              <select
                value={form.direccion.localidad}
                onChange={(event) => {
                  const locality = event.target.value;
                  setForm((current) => ({
                    ...current,
                    direccion: {
                      ...current.direccion,
                      localidad: locality
                    }
                  }));
                }}
                required
              >
                <option value="">Selecciona una localidad</option>
                {postalLocalities.map((locality) => (
                  <option key={locality} value={locality}>
                    {locality}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.direccion.localidad}
                readOnly
                placeholder="Se rellena con el codigo postal"
                required
              />
            )}
          </label>
          <label>
            Ciudad
            <input
              value={form.direccion.ciudad}
              readOnly
              placeholder="Se rellena con el codigo postal"
              required
            />
          </label>
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
        </div>
        {postalLoading ? <p className="muted-text">Consultando codigo postal...</p> : null}
        {postalMessage ? <p className="inline-message">{postalMessage}</p> : null}

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
        <div className="auth-register-actions">
          <button type="submit" className="button button--primary" disabled={loading}>
            {loading ? "Enviando..." : "Enviar codigo"}
          </button>
        </div>
        <p className="muted-text">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </form>

      {showVerifyModal ? (
        <div className="modal-overlay">
          <form className="auth-card auth-card--modal" onSubmit={handleVerifyCode}>
            <h2>Verifica tu correo</h2>
            <p className="muted-text">
              Se ha enviado un codigo de seguridad al correo <strong>{form.email}</strong>, favor de verificarlo.
            </p>
            <div className={`code-box-grid is-${verificationState}`} onPaste={handleCodePaste}>
              {verificationDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    codeInputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleCodeDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  required
                />
              ))}
            </div>
            {verificationState === "error" ? <p className="inline-message inline-message--error">Codigo invalido.</p> : null}
            {verificationState === "success" ? <p className="inline-message inline-message--success">Codigo valido.</p> : null}
            {message ? <p className="inline-message">{message}</p> : null}
            <div className="action-row">
              <button type="submit" className="button button--primary" disabled={loading}>
                {loading ? "Validando..." : "Validar codigo y crear cuenta"}
              </button>
              <button type="button" className="button button--ghost" onClick={handleResendCode} disabled={loading}>
                Reenviar codigo
              </button>
              <button type="button" className="button button--ghost" onClick={() => setShowVerifyModal(false)} disabled={loading}>
                Cerrar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showWelcomeModal ? (
        <div className="modal-overlay">
          <div className="auth-card auth-card--modal welcome-modal">
            <button type="button" className="modal-close" onClick={() => navigate("/")} aria-label="Cerrar">
              x
            </button>
            <h2>Bienvenida a Gray C Shop</h2>
            <p>Gracias por ser parte de nuestra comunidad.</p>
            <p className="muted-text">Tu cuenta ya esta activa y lista para comprar.</p>
            <button type="button" className="button button--primary" onClick={() => navigate("/")}>
              Entrar a la tienda
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
