import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

const fallbackHome = {
  settings: {},
  categories: [],
  banners: [],
  videos: [],
  music: [],
  featuredProducts: [],
  offerProducts: [],
  bestsellerProducts: []
};

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [home, setHome] = useState(fallbackHome);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
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

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }

    setBusyId(product.id);
    setMessage("");

    try {
      await addToCart(product.id, 1);
      setMessage(`${product.nombre} se agrego al carrito.`);
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setBusyId("");
    }
  };

  const handleBuyNow = async (product) => {
    const added = await handleAddToCart(product);
    if (added) {
      navigate("/checkout");
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-shell">
        <article className="hero-panel hero-panel--primary">
          <p className="eyebrow">{home.settings.heroEyebrow || "Marketplace premium"}</p>
          <h1>
            {home.settings.heroTitle ||
              "Compra tecnologia, hogar, mayoreo y categorias modernas desde una sola plataforma profesional."}
          </h1>
          <p>
            {home.settings.heroDescription ||
              "Una tienda elegante, confiable y responsive para vender productos fisicos, importados y categorias premium."}
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="button button--primary">
              {home.settings.heroPrimary || "Explorar catalogo"}
            </Link>
            <Link to="/catalogo?sort=discount" className="button button--ghost">
              {home.settings.heroSecondary || "Ver ofertas"}
            </Link>
          </div>
        </article>

        <aside className="hero-panel hero-panel--secondary">
          {(home.banners[0] && (
            <div className="media-banner">
              <img src={home.banners[0].mediaUrl} alt={home.banners[0].titulo} />
              <div className="media-banner__copy">
                <strong>{home.banners[0].titulo}</strong>
                <span>{home.banners[0].subtitulo}</span>
              </div>
            </div>
          )) || (
            <div className="hero-stat-grid">
              <article>
                <strong>+10</strong>
                <span>Categorias activas</span>
              </article>
              <article>
                <strong>Premium</strong>
                <span>Diseño formal y moderno</span>
              </article>
              <article>
                <strong>Seguro</strong>
                <span>Listo para pagos reales</span>
              </article>
            </div>
          )}
        </aside>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Categorias destacadas</p>
            <h2>Explora por tipo de compra</h2>
          </div>
          <Link to="/catalogo" className="section-link">
            Ver todo
          </Link>
        </div>
        <div className="category-grid">
          {home.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="category-tile"
              style={{ "--accent": category.color }}
              onClick={() => navigate(`/catalogo?category=${category.slug}`)}
            >
              <strong>{category.nombre}</strong>
              <span>{category.descripcion}</span>
            </button>
          ))}
        </div>
      </section>

      {message && <p className="inline-message">{message}</p>}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Comerciales y contenido</p>
            <h2>{home.settings.videoTitle || "Video banners para portada"}</h2>
          </div>
        </div>
        <div className="video-grid">
          {home.videos.map((video) => (
            <article key={video.id} className="video-card">
              <video controls poster={video.posterUrl}>
                <source src={video.videoUrl} />
              </video>
              <strong>{video.titulo}</strong>
              <p>{video.descripcion}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Recomendados</p>
            <h2>{home.settings.featuredTitle || "Curados para una vitrina premium"}</h2>
          </div>
        </div>
        <div className="product-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton-card" />)
            : home.featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  busy={busyId === product.id}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                />
              ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Ofertas especiales</p>
            <h2>{home.settings.offersTitle || "Aprovecha precios con descuento"}</h2>
          </div>
          <Link to="/catalogo?sort=discount" className="section-link">
            Ver ofertas
          </Link>
        </div>
        <div className="product-grid">
          {home.offerProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              busy={busyId === product.id}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Mas vendidos</p>
            <h2>{home.settings.bestsellersTitle || "Productos con mayor confianza del publico"}</h2>
          </div>
        </div>
        <div className="product-grid">
          {home.bestsellerProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              busy={busyId === product.id}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
