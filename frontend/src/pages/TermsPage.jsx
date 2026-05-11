import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";

const defaultTerms = `Al usar esta tienda aceptas nuestros terminos y condiciones.

1. Los precios y disponibilidad pueden cambiar sin previo aviso.
2. Toda compra queda sujeta a validacion de pago.
3. Los tiempos de entrega son estimados y pueden variar por zona.
4. Las devoluciones aplican segun la politica de cada producto.
5. El uso indebido de la plataforma puede provocar suspension de cuenta.
6. Para dudas sobre pedidos y pagos, contacta soporte oficial de la tienda.`;

export function TermsPage() {
  const [siteName, setSiteName] = useState("Gray C Shop");
  const [terms, setTerms] = useState(defaultTerms);

  useEffect(() => {
    let active = true;
    apiFetch("/products/home")
      .then((payload) => {
        if (!active) {
          return;
        }
        setSiteName(payload?.general?.siteName || "Gray C Shop");
        setTerms(payload?.general?.termsAndConditions || defaultTerms);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Legal</p>
          <h1>Terminos y Condiciones</h1>
        </div>
      </div>
      <p className="muted-text">Ultima actualizacion visible para usuarios de {siteName}.</p>
      <article className="detail-card">
        {terms.split("\n").map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </article>
    </section>
  );
}
