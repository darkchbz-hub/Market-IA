import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";

const defaultAbout = `Gray C Shop es una tienda online pensada para ofrecer una experiencia de compra moderna, segura y confiable.

Trabajamos para reunir en un solo lugar tecnologia, hogar, jardin, productos digitales y mucho mas, con atencion cercana y seguimiento real de tus pedidos.

Nuestro compromiso es ayudarte a comprar con claridad, soporte y confianza en cada paso.`;

export function AboutPage() {
  const [siteName, setSiteName] = useState("Gray C Shop");
  const [aboutText, setAboutText] = useState(defaultAbout);

  useEffect(() => {
    apiFetch("/products/home")
      .then((payload) => {
        setSiteName(payload?.general?.siteName || "Gray C Shop");
        setAboutText(payload?.general?.aboutUs || defaultAbout);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section-card">
      <div className="section-heading section-heading--compact">
        <div>
          <p className="section-label">Conocenos</p>
          <h1>Sobre nosotros</h1>
        </div>
      </div>
      <p className="muted-text">{siteName}</p>
      {String(aboutText || defaultAbout)
        .split("\n")
        .filter(Boolean)
        .map((line, index) => (
          <p key={`about-line-${index}`}>{line}</p>
        ))}
    </section>
  );
}

