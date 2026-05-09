import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

export function CatalogPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payload, setPayload] = useState({ items: [], pagination: { total: 0 }, filters: { brands: [] } });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      category: searchParams.get("category") || "",
      brand: searchParams.get("brand") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      rating: searchParams.get("rating") || "",
      availability: searchParams.get("availability") || "",
      sort: searchParams.get("sort") || "recent"
    }),
    [searchParams]
  );

  useEffect(() => {
    apiFetch("/products/categories")
      .then((response) => setCategories(response.items || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    params.set("limit", "18");

    apiFetch(`/products?${params.toString()}`)
      .then((response) => {
        if (active) {
          setPayload(response);
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
  }, [filters]);

  const updateFilters = (nextValues) => {
    const params = new URLSearchParams();

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }

    setBusyId(product.id);

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
    <div className="catalog-shell">
      <aside className="filter-panel">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Filtros</p>
            <h2>Refina tu busqueda</h2>
          </div>
        </div>

        <label>
          Buscar
          <input
            type="search"
            value={filters.search}
            onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
            placeholder="Producto, marca o descripcion"
          />
        </label>

        <label>
          Categoria
          <select value={filters.category} onChange={(event) => updateFilters({ ...filters, category: event.target.value })}>
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Marca
          <select value={filters.brand} onChange={(event) => updateFilters({ ...filters, brand: event.target.value })}>
            <option value="">Todas</option>
            {(payload.filters?.brands || []).map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>

        <div className="form-inline">
          <label>
            Min
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(event) => updateFilters({ ...filters, minPrice: event.target.value })}
            />
          </label>
          <label>
            Max
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(event) => updateFilters({ ...filters, maxPrice: event.target.value })}
            />
          </label>
        </div>

        <label>
          Calificacion minima
          <select value={filters.rating} onChange={(event) => updateFilters({ ...filters, rating: event.target.value })}>
            <option value="">Cualquiera</option>
            <option value="4">4 estrellas o mas</option>
            <option value="3">3 estrellas o mas</option>
          </select>
        </label>

        <label>
          Disponibilidad
          <select
            value={filters.availability}
            onChange={(event) => updateFilters({ ...filters, availability: event.target.value })}
          >
            <option value="">Todas</option>
            <option value="Disponible">Disponible</option>
            <option value="Preventa">Preventa</option>
          </select>
        </label>

        <label>
          Ordenar
          <select value={filters.sort} onChange={(event) => updateFilters({ ...filters, sort: event.target.value })}>
            <option value="recent">Mas recientes</option>
            <option value="price_asc">Menor precio</option>
            <option value="price_desc">Mayor precio</option>
            <option value="rating">Mejor calificacion</option>
            <option value="popular">Popularidad</option>
            <option value="discount">Mayor descuento</option>
          </select>
        </label>
      </aside>

      <section className="catalog-results">
        <div className="section-heading">
          <div>
            <p className="section-label">Catalogo</p>
            <h1>{loading ? "Cargando productos..." : `${payload.pagination.total || 0} productos encontrados`}</h1>
          </div>
          {message && <p className="inline-message">{message}</p>}
        </div>

        <div className="product-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card" />)
            : payload.items.map((product) => (
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
