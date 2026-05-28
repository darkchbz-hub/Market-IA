import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";

const fallbackHome = {
  settings: {},
  general: {},
  categories: [],
  banners: [],
  videos: [],
  partnerLogos: []
};

export function HomePage() {
  const navigate = useNavigate();
  const [home, setHome] = useState(fallbackHome);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/products/home")
      .then((payload) => {
        if (active) {
          setHome(payload);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const heroStats = useMemo(
    () => [
      { label: "Ventas", value: "Reiniciadas" },
      { label: "Catalogo", value: "En renovacion" },
      { label: "Experiencia", value: "Premium" }
    ],
    []
  );

  return (
    <div className="page-stack">
      <section className="hero-shell hero-shell--revamp">
        <article className="hero-panel hero-panel--primary">
          <p className="eyebrow">Nueva etapa</p>
          <h1>{home.settings.heroTitle || "Gray C Shop ahora con una identidad visual de alto nivel."}</h1>
          <p>
            {home.settings.heroDescription ||
              "Redisenamos la web completa: nuevas vistas, tema premium, interfaz mas clara y una experiencia profesional para escalar."}
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="button button--primary">
              Ver nuevas vistas
            </Link>
            <Link to="/chat" className="button button--ghost">
              Hablar con soporte
            </Link>
          </div>
        </article>

        <aside className="hero-panel hero-panel--secondary">
          <div className="hero-stat-grid">
            {heroStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {message && <p className="inline-message">{message}</p>}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Panorama comercial</p>
            <h2>Estado actual de la tienda</h2>
          </div>
        </div>
        <div className="detail-columns detail-columns--status">
          <article className="detail-card">
            <h3>Productos eliminados</h3>
            <p>El inventario visible fue retirado para crear una nueva coleccion con estandar mas alto.</p>
          </article>
          <article className="detail-card">
            <h3>Ventas restauradas</h3>
            <p>La seccion comercial se mantiene limpia para iniciar un nuevo ciclo de ventas desde base renovada.</p>
          </article>
          <article className="detail-card">
            <h3>Experiencia mejorada</h3>
            <p>Navegacion renovada, botones de accion rapida y un look mucho mas profesional.</p>
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Vistas nuevas</p>
            <h2>Explora la nueva estructura</h2>
          </div>
        </div>

        <div className="category-grid category-grid--showcase">
          {home.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="category-tile"
              style={{ "--accent": category.color }}
              onClick={() => navigate(`/catalogo?category=${category.slug}`)}
            >
              <strong>{category.nombre}</strong>
              <span>{category.descripcion || "Seccion renovada y lista para relanzamiento."}</span>
            </button>
          ))}
        </div>
      </section>

      {!!home.banners?.length && (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-label">Identidad visual</p>
              <h2>Nueva direccion grafica</h2>
            </div>
          </div>
          <div className="video-grid">
            {home.banners.slice(0, 2).map((banner) => (
              <article key={banner.id} className="video-card">
                <img src={banner.mediaUrl} alt={banner.titulo} className="media-thumb media-thumb--wide" />
                <strong>{banner.titulo}</strong>
                <p>{banner.subtitulo}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {loading && <p className="muted-text">Cargando contenido visual...</p>}
    </div>
  );
}
