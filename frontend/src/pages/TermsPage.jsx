import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api.js";
import { formatMexicoDate } from "../lib/date.js";

const legalDocuments = {
  terms: {
    eyebrow: "Reglas de la tienda", title: "Términos y condiciones", intro: "Las reglas que mantienen cada compra clara, segura y bien documentada.", icon: "⚖",
    sections: [
      ["Uso de la tienda", "Puedes navegar libremente por Gray C Shop. Para comprar, administrar pedidos o descargar documentos necesitarás iniciar sesión con información verdadera y mantener segura tu cuenta."],
      ["Precios y disponibilidad", "Los precios, promociones, existencias y características se confirman al finalizar la compra. Si existe un error evidente, te contactaremos antes de procesar el pedido."],
      ["Pagos y pedidos", "Un pedido solo se considera pagado cuando su estado aparece como Pagado. Los comprobantes enviados están sujetos a revisión y no sustituyen la confirmación del pago."],
      ["Entregas y servicios digitales", "Los plazos mostrados son estimados. Productos físicos, importados y digitales pueden tener procesos de entrega diferentes, indicados en su ficha y en el historial del pedido."],
      ["Cuenta y conducta", "No está permitido usar la tienda para fraude, suplantación, abuso del soporte o acceso a información de otras personas. Podemos restringir cuentas cuando sea necesario proteger la plataforma."],
      ["Soporte", "Conserva tu número de pedido y folios. El equipo de soporte puede solicitar información adicional para validar pagos, entregas, garantías o incidencias."]
    ]
  },
  privacy: {
    eyebrow: "Tus datos bajo resguardo", title: "Política de privacidad", intro: "Te explicamos qué información utilizamos y para qué la necesitamos.", icon: "◉",
    sections: [
      ["Datos que recopilamos", "Podemos guardar nombre, correo, teléfono, dirección de entrega, datos de cuenta, carrito, pedidos, comprobantes y conversaciones de soporte."],
      ["Cómo utilizamos la información", "La usamos para administrar tu cuenta, procesar compras, entregar productos, prevenir fraude, atender solicitudes y mejorar la experiencia de la tienda."],
      ["Pagos", "Los proveedores de pago procesan la información financiera necesaria. Gray C Shop no debe solicitarte contraseñas bancarias, NIP ni códigos privados dentro del chat."],
      ["Comprobantes y documentos", "Los archivos enviados se utilizan para revisar el pedido correspondiente. Solo el personal autorizado debe consultarlos y nunca se publican como contenido de la tienda."],
      ["Asistentes de soporte", "Grayce, Barban y Taz utilizan únicamente el contexto autorizado de tu cuenta para ayudarte. No pueden aprobar pagos ni revelar información de otros clientes."],
      ["Tus decisiones", "Puedes solicitar correcciones de tus datos y contactar a soporte para consultas relacionadas con privacidad, conservación o eliminación cuando legalmente corresponda."]
    ]
  },
  refunds: {
    eyebrow: "Compras protegidas", title: "Cambios y reembolsos", intro: "Una guía sencilla para resolver cancelaciones, productos con problemas y devoluciones.", icon: "↺",
    sections: [
      ["Antes del envío", "Puedes solicitar la cancelación mientras el pedido todavía no haya sido enviado o entregado digitalmente. La aceptación dependerá del estado real del pedido."],
      ["Productos físicos", "Si el producto llega incorrecto, incompleto o dañado, contacta a soporte cuanto antes y conserva empaque, etiquetas, fotografías y comprobante de compra."],
      ["Productos digitales", "Licencias, accesos, suscripciones o contenido entregado pueden no admitir devolución después de ser activados. Revisa las condiciones indicadas en cada producto."],
      ["Revisión del caso", "El equipo podrá solicitar evidencia para verificar el problema. Enviar una solicitud no garantiza automáticamente un reembolso; recibirás una resolución según el producto y el caso."],
      ["Forma y tiempo del reembolso", "Cuando se autorice, el reembolso se enviará al método disponible o se acordará una alternativa. El tiempo para reflejarse también depende del proveedor de pago."],
      ["Cómo solicitar ayuda", "Entra a Perfil, abre el pedido correspondiente y contacta a soporte indicando número de orden, folio, producto y una descripción clara del inconveniente."]
    ]
  }
};

const legalLinks = [["terms", "/terminos", "Términos"], ["privacy", "/privacidad", "Privacidad"], ["refunds", "/reembolsos", "Cambios y reembolsos"]];

function LegalDocumentPage({ type }) {
  const document = legalDocuments[type];
  const [siteName, setSiteName] = useState("Gray C Shop");
  const [loading, setLoading] = useState(type === "terms");

  useEffect(() => {
    let active = true;
    apiFetch("/products/home").then((payload) => {
      if (!active) return;
      setSiteName(payload?.general?.siteName || "Gray C Shop");
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type]);

  if (loading) return <section className="section-card legal-loading"><span /><span /><span /><span /></section>;

  return (
    <div className={`legal-page legal-page--${type}`}>
      <header className="legal-hero">
        <div className="legal-hero__moon" aria-hidden="true"><span>{document.icon}</span><i /><i /><i /></div>
        <div><p className="section-label">{document.eyebrow}</p><h1>{document.title}</h1><p>{document.intro}</p></div>
        <span className="legal-hero__stamp">Actualizado {formatMexicoDate(new Date().toISOString(), { day: "numeric", month: "long", year: "numeric" })}</span>
      </header>
      <nav className="legal-switcher" aria-label="Documentos legales">
        {legalLinks.map(([id, path, label]) => <Link className={type === id ? "is-active" : ""} to={path} key={id}>{label}</Link>)}
      </nav>
      <section className="legal-document">
        <div className="legal-document__intro"><span>{document.icon}</span><div><small>{siteName}</small><strong>{document.title}</strong><p>Lee cada apartado antes de utilizar el servicio o completar una compra.</p></div></div>
        <div className="legal-section-grid">
          {document.sections.map(([title, content], index) => <article key={`${title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{content}</p></div></article>)}
        </div>
        <footer className="legal-help"><div><strong>¿Tienes una duda sobre este documento?</strong><p>Barban puede orientarte o dejar tu caso preparado para atención humana.</p></div><Link className="button button--primary" to="/chat">Hablar con soporte</Link></footer>
      </section>
    </div>
  );
}

export function TermsPage() { return <LegalDocumentPage type="terms" />; }
export function PrivacyPage() { return <LegalDocumentPage type="privacy" />; }
export function RefundsPage() { return <LegalDocumentPage type="refunds" />; }
