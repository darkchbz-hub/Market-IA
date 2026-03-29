import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";
import { demoProducts } from "../lib/demo-products.js";

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const trackedSearchRef = useRef("");
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyProductId, setBusyProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filters = {
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || ""
  };

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.category) {
      params.set("category", filters.category);
    }

    if (filters.minPrice) {
      params.set("minPrice", filters.minPrice);
    }

    if (filters.maxPrice) {
      params.set("maxPrice", filters.maxPrice);
    }

    params.set("limit", "12");

    setLoading(true);

    apiFetch(`/products?${params.toString()}`)
      .then((payload) => {
        if (!active) {
          return;
        }

        setProducts(payload.items);
        setPagination(payload.pagination);
      })
      .catch((error) => {
        if (active) {
          const normalizedSearch = filters.search.trim().toLowerCase();
          const filteredDemo = demoProducts.filter((product) => {
            const matchesSearch =
              !normalizedSearch ||
              product.nombre.toLowerCase().includes(normalizedSearch) ||
              product.descripcion.toLowerCase().includes(normalizedSearch);
            const matchesCategory = !filters.category || product.categoria === filters.category;
            const matchesMin = !filters.minPrice || product.precio >= Number(filters.minPrice);
            const matchesMax = !filters.maxPrice || product.precio <= Number(filters.maxPrice);

            return matchesSearch && matchesCategory && matchesMin && matchesMax;
          });

          setProducts(filteredDemo);
          setPagination({
            page: 1,
            limit: 12,
            total: filteredDemo.length
          });
          setMessage(`${error.message} Mostrando catalogo demo mientras configuras la base de datos.`);
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
  }, [filters.search, filters.category, filters.minPrice, filters.maxPrice]);

  useEffect(() => {
    if (!isAuthenticated || !token || !filters.search.trim()) {
      return;
    }

    if (trackedSearchRef.current === filters.search.trim()) {
      return;
    }

    trackedSearchRef.current = filters.search.trim();

    apiFetch("/tracking/searches", {
      method: "POST",
      token,
      body: {
        busqueda: filters.search.trim()
      }
    }).catch(() => {});
  }, [filters.search, isAuthenticated, token]);

  const updateFilters = (nextFilters) => {
    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setBusyProductId(product.id);
    setMessage("");

    try {
      await addToCart(product.id, 1);
      setMessage(`${product.nombre} se agrego al carrito.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyProductId("");
    }
  };

  const handleShowDetails = (product) => {
    setSelectedProduct(product);

    if (isAuthenticated) {
      apiFetch(`/products/${product.id}/view`, {
        method: "POST",
        token
      }).catch(() => {});
    }
  };

  return (
    <div className="page-section page-section--spaced">
      <section className="home-hero">
        <article className="hero-banner hero-banner--primary">
          <p className="eyebrow">Marketplace digital</p>
          <h1>Compra suscripciones IA, packs y servicios web desde una sola tienda.</h1>
          <p>Usuarios, carrito, checkout, pagos, historial, chat y panel admin en una sola plataforma.</p>
        </article>
        <article className="hero-banner hero-banner--secondary">
          <p className="eyebrow">Metodos de pago</p>
          <h2>Stripe, PayPal y Mercado Pago</h2>
          <p>La orden se crea primero en el sistema y luego se confirma con el proveedor.</p>
        </article>
      </section>

      <section className="quick-categories">
        <button type="button" className="pill" onClick={() => updateFilters({ ...filters, category: "" })}>
          Todo
        </button>
        <button type="button" className="pill" onClick={() => updateFilters({ ...filters, category: "apps" })}>
          Apps IA
        </button>
        <button type="button" className="pill" onClick={() => updateFilters({ ...filters, category: "packs" })}>
          Packs
        </button>
        <button type="button" className="pill" onClick={() => updateFilters({ ...filters, category: "webs" })}>
          Servicios web
        </button>
      </section>

      <section className="catalog-layout">
        <aside className="sidebar-card">
          <div className="sidebar-card__block">
            <h3>Filtrar</h3>
            <label>
              Buscar
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                placeholder="Ej. ChatGPT, landing, pack"
              />
            </label>
            <label>
              Categoria
              <select
                value={filters.category}
                onChange={(event) => updateFilters({ ...filters, category: event.target.value })}
              >
                <option value="">Todas</option>
                <option value="apps">Apps IA</option>
                <option value="packs">Packs</option>
                <option value="webs">Servicios web</option>
              </select>
            </label>
            <label>
              Precio minimo
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.minPrice}
                onChange={(event) => updateFilters({ ...filters, minPrice: event.target.value })}
              />
            </label>
            <label>
              Precio maximo
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.maxPrice}
                onChange={(event) => updateFilters({ ...filters, maxPrice: event.target.value })}
              />
            </label>
          </div>

          <div className="sidebar-card__block">
            <h3>Ventajas</h3>
            <ul className="feature-list">
              <li>Historial por usuario</li>
              <li>Carrito persistente</li>
              <li>Checkout con direccion</li>
              <li>Pagos por proveedor</li>
              <li>Soporte en tiempo real</li>
            </ul>
          </div>
        </aside>

        <div className="catalog-content">
          <div className="section-header">
            <div>
              <p className="section-label">Catalogo</p>
              <h2>{loading ? "Cargando productos..." : `${pagination.total} productos encontrados`}</h2>
            </div>
            {message && <p className="inline-message">{message}</p>}
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                busy={busyProductId === product.id}
                onAddToCart={handleAddToCart}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="overlay" onClick={() => setSelectedProduct(null)}>
          <div className="detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="detail-modal__image">
              <img src={selectedProduct.imagenes?.[0]} alt={selectedProduct.nombre} />
            </div>
            <div className="detail-modal__content">
              <p className="section-label">{selectedProduct.categoria}</p>
              <h3>{selectedProduct.nombre}</h3>
              <p>{selectedProduct.descripcion}</p>
              <div className="tag-row">
                {(selectedProduct.tags || []).map((tag) => (
                  <span key={tag} className="pill pill--small">
                    {tag}
                  </span>
                ))}
              </div>
              <strong className="price-xl">${selectedProduct.precio.toFixed(2)}</strong>
              <button type="button" className="button button--primary" onClick={() => handleAddToCart(selectedProduct)}>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
