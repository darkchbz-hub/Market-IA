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
  const [spotlightIndex, setSpotlightIndex] = useState(0);

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
      { label: "Catalogo", value: "Proximamente" },
      { label: "Experiencia", value: "Premium" }
    ],
    []
  );

  const promoItems = useMemo(() => {
    const banners = (home.banners || []).slice(0, 5).map((banner) => banner.titulo).filter(Boolean);
    const categories = (home.categories || []).slice(0, 6).map((category) => category.nombre).filter(Boolean);
    const base = [...banners, ...categories];
    return base.length
      ? [...base, ...base]
      : [
          "Ofertas destacadas",
          "Tecnologia premium",
          "Hogar y jardin",
          "Compras mas claras",
          "Soporte directo",
          "Novedades de la tienda",
          "Ofertas destacadas",
          "Tecnologia premium"
        ];
  }, [home.banners, home.categories]);

  const spotlightSlides = useMemo(() => {
    const bannerSlides =
      (home.banners || []).slice(0, 3).map((banner, index) => ({
        id: `banner-${banner.id}`,
        eyebrow: index === 0 ? "Oferta destacada" : "Novedad visual",
        title: banner.titulo || "Coleccion destacada",
        description: banner.subtitulo || "Una forma mas limpia de destacar lo importante desde la portada.",
        cta: "Ver catalogo",
        image: banner.mediaUrl || "",
        action: () => navigate("/catalogo")
      })) || [];

    const fallbackSlides = (home.categories || []).slice(0, 3).map((category, index) => ({
      id: `category-${category.id}`,
      eyebrow: "Explora por tipo de compra",
      title: category.nombre,
      description: category.descripcion || "Abre esta seccion para ver una experiencia mas ordenada.",
      cta: "Explorar categoria",
      image: "",
      action: () => navigate(`/catalogo?category=${category.slug}`)
    }));

    const combined = [...bannerSlides, ...fallbackSlides];
    return combined.length ? combined : [
      {
        id: "default-1",
        eyebrow: "Inicio premium",
        title: "Una portada mas limpia, mas visual y mas facil de navegar",
        description: "Abrimos lo importante primero y dejamos el resto ordenado por secciones.",
        cta: "Ir al catalogo",
        image: "",
        action: () => navigate("/catalogo")
      }
    ];
  }, [home.banners, home.categories, navigate]);

  useEffect(() => {
    if (spotlightSlides.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSpotlightIndex((current) => (current + 1) % spotlightSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [spotlightSlides.length]);

  useEffect(() => {
    setSpotlightIndex(0);
  }, [home.banners, home.categories]);

  return (
    <div className="page-stack">
      <section className="hero-shell hero-shell--revamp">
        <article className="hero-panel hero-panel--primary hero-panel--slider">
          <div className="hero-slider">
            {spotlightSlides.map((slide, index) => {
              const isActive = index === spotlightIndex;
              return (
                <div key={slide.id} className={`hero-slide${isActive ? " is-active" : ""}`}>
                  <div className="hero-slide__copy">
                    <p className="eyebrow">{slide.eyebrow}</p>
                    <h1>{slide.title || home.settings.heroTitle || "Gray C Shop"}</h1>
                    <p>{slide.description || home.settings.heroDescription}</p>
                    <div className="hero-actions">
                      <button type="button" className="button button--primary" onClick={slide.action}>
                        {slide.cta || "Explorar"}
                      </button>
                      <Link to="/chat" className="button button--ghost">
                        Soporte
                      </Link>
                    </div>
                  </div>
                  <div className="hero-slide__media">
                    {slide.image ? (
                      <img src={slide.image} alt={slide.title} />
                    ) : (
                      <div className="hero-slide__placeholder">
                        <strong>{slide.title}</strong>
                        <span>{slide.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hero-slider__dots">
            {spotlightSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === spotlightIndex ? "is-active" : ""}
                onClick={() => setSpotlightIndex(index)}
                aria-label={`Ir a ${slide.title}`}
              />
            ))}
          </div>
        </article>

        <aside className="hero-panel hero-panel--secondary">
          <p className="eyebrow">Tema visual</p>
          <h2>Una experiencia mas ordenada</h2>
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

      <section className="section-card section-card--ticker">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Inicio dinamico</p>
            <h2>Lo importante pasa primero</h2>
          </div>
        </div>
        <div className="promo-ticker" aria-label="Destacados de la tienda">
          <div className="promo-ticker__track">
            {promoItems.map((item, index) => (
              <span key={`${item}-${index}`} className="promo-ticker__item">
                {item}
              </span>
            ))}
          </div>
        </div>
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

      {!!home.partnerLogos?.length && (
        <section className="section-card partner-strip">
          <div className="section-heading">
            <div>
              <p className="section-label">Confianza comercial</p>
              <h2>{home.general?.partnerTitle || "Empresas asociadas"}</h2>
            </div>
          </div>

          <div className="partner-logo-grid">
            {home.partnerLogos.map((partner) => (
              <article key={partner.id || partner.name} className="partner-logo-card">
                {partner.logoUrl ? <img src={partner.logoUrl} alt={partner.name || "Empresa asociada"} /> : <span>{partner.name}</span>}
                {partner.name && <strong>{partner.name}</strong>}
              </article>
            ))}
          </div>
        </section>
      )}

      {loading && <p className="muted-text">Cargando contenido visual...</p>}
    </div>
  );
}
