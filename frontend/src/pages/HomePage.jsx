import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api.js";

const fallbackHome = {
  settings: {},
  general: {},
  categories: [],
  banners: [],
  videos: [],
  partnerLogos: [],
  offerProducts: []
};

function getYouTubeEmbedUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");
    let id = "";

    if (host === "youtu.be") {
      id = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host.includes("youtube.com")) {
      id = parsed.searchParams.get("v") || "";
      if (!id && parsed.pathname.includes("/shorts/")) {
        id = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }
      if (!id && parsed.pathname.includes("/embed/")) {
        id = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }

    return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}` : "";
  } catch {
    return "";
  }
}

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(url || "")) || String(url || "").startsWith("data:video/");
}

const defaultStatusCards = [
  {
    title: "Productos eliminados",
    text: "El inventario visible fue retirado para crear una nueva coleccion con estandar mas alto."
  },
  {
    title: "Ventas restauradas",
    text: "La seccion comercial se mantiene limpia para iniciar un nuevo ciclo de ventas desde base renovada."
  },
  {
    title: "Experiencia mejorada",
    text: "Navegacion renovada, botones de accion rapida y un look mucho mas profesional."
  }
];

function getDailyOfferProducts(products) {
  const offers = Array.isArray(products) ? products.filter((product) => product?.oferta) : [];
  const daySeed = Math.floor(Date.now() / 86400000);

  return [...offers]
    .sort((a, b) => {
      const left = `${a.id || a.slug || a.nombre}-${daySeed}`;
      const right = `${b.id || b.slug || b.nombre}-${daySeed}`;
      return left.localeCompare(right);
    })
    .slice(0, 6);
}

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
  const activeVideo = useMemo(() => {
    const videos = Array.isArray(home.videos) ? home.videos : [];
    return videos.find((video) => video.activa !== false && video.videoUrl) || videos.find((video) => video.videoUrl) || null;
  }, [home.videos]);
  const activeVideoEmbed = getYouTubeEmbedUrl(activeVideo?.videoUrl);
  const statusCards = useMemo(() => {
    const configured = Array.isArray(home.settings?.storeStatusCards) ? home.settings.storeStatusCards : [];
    const normalized = configured
      .map((card, index) => ({
        title: String(card?.title || defaultStatusCards[index]?.title || "").trim(),
        text: String(card?.text || defaultStatusCards[index]?.text || "").trim()
      }))
      .filter((card) => card.title || card.text);

    return normalized.length ? normalized.slice(0, 3) : defaultStatusCards;
  }, [home.settings]);
  const dailyOfferProducts = useMemo(() => getDailyOfferProducts(home.offerProducts), [home.offerProducts]);

  const promoItems = useMemo(() => {
    const banners = (home.banners || []).slice(0, 5).map((banner) => banner.titulo).filter(Boolean);
    const base = [...banners];
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
  }, [home.banners]);

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

    const combined = [...bannerSlides];
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
  }, [home.banners, navigate]);

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
  }, [home.banners]);

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

        <aside className="hero-panel hero-panel--secondary home-ad-panel">
          <p className="eyebrow">{activeVideo ? "Anuncio destacado" : "Tema visual"}</p>
          {activeVideo ? (
            <>
              <h2>{activeVideo.titulo || "Anuncio de portada"}</h2>
              <div className="home-ad-player">
                {activeVideoEmbed ? (
                  <iframe
                    src={activeVideoEmbed}
                    title={activeVideo.titulo || "Video de portada"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : isVideoUrl(activeVideo.videoUrl) ? (
                  <video src={activeVideo.videoUrl} autoPlay muted loop playsInline poster={activeVideo.posterUrl || ""} />
                ) : (
                  <a className="button button--primary" href={activeVideo.videoUrl} target="_blank" rel="noreferrer">
                    Ver anuncio
                  </a>
                )}
              </div>
              {activeVideo.descripcion && <p className="muted-text">{activeVideo.descripcion}</p>}
            </>
          ) : (
            <>
              <h2>Una experiencia mas ordenada</h2>
              <div className="hero-stat-grid">
                {heroStats.map((item) => (
                  <article key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </>
          )}
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
          {statusCards.map((card, index) => (
            <article key={`${card.title}-${index}`} className="detail-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      {!!dailyOfferProducts.length && (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-label">Ofertas del dia</p>
              <h2>Anuncios compactos con productos en promocion</h2>
            </div>
          </div>
          <div className="daily-offer-grid">
            {dailyOfferProducts.map((product) => {
              const hasOffer = Number(product.precioAnterior || 0) > Number(product.precio || 0);
              return (
              <article key={product.id} className="daily-offer-card">
                <img src={product.imagenes?.[0] || "/assets/gray-c-shop-logo.png?v=20260514-2"} alt={product.nombre} />
                <div>
                  <strong>{product.nombre}</strong>
                  <span>{product.categoria}</span>
                  <p>
                    {hasOffer && <small>${Number(product.precioAnterior || 0).toFixed(2)}</small>}
                    <b>${Number(product.precio || 0).toFixed(2)}</b>
                    {Number(product.descuento || 0) > 0 && <em>{product.descuento}% off</em>}
                  </p>
                </div>
              </article>
              );
            })}
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
