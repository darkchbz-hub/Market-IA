import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { ProductCarousel } from "../components/ProductCarousel.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

export function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 24 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);

  const activeCategory = useMemo(() => searchParams.get("category") || "", [searchParams]);
  const activeSearch = useMemo(() => searchParams.get("search") || "", [searchParams]);

  useEffect(() => {
    apiFetch("/products/categories")
      .then((response) => setCategories(response.items || []))
      .catch((error) => {
        setCategories([]);
        setMessage(error.message || "No se pudieron cargar las categorias.");
      });
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    params.set("limit", "48");

    if (activeCategory) {
      params.set("category", activeCategory);
    }

    if (activeSearch.trim()) {
      params.set("search", activeSearch.trim());
    }

    setLoading(true);
    setMessage("");

    apiFetch(`/products?${params.toString()}`)
      .then((response) => {
        if (!active) return;
        setProducts(response.items || []);
        setPagination(response.pagination || { total: 0, limit: 48 });
      })
      .catch((error) => {
        if (!active) return;
        setProducts([]);
        setPagination({ total: 0, limit: 48 });
        setMessage(error.message || "No se pudieron cargar los productos.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeCategory, activeSearch]);

  const updateCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const addProductToCart = async (product) => {
    setBusyProductId(product.id);
    try {
      await addToCart(product.id, 1);
      setMessage(`${product.nombre} se agrego al carrito.`);
    } catch (error) {
      setMessage(error.message || "No se pudo agregar al carrito.");
    } finally {
      setBusyProductId(null);
    }
  };

  const buyProductNow = async (product) => {
    setBusyProductId(product.id);
    try {
      await addToCart(product.id, 1);
      navigate("/checkout");
    } catch (error) {
      setMessage(error.message || "No se pudo iniciar la compra.");
    } finally {
      setBusyProductId(null);
    }
  };

  const emptyTitle = activeSearch ? "Sin coincidencias por ahora" : "Proximamente";
  const emptyText = activeSearch
    ? `No encontramos productos para "${activeSearch}". Prueba con menos letras, marca, categoria o tags.`
    : activeCategory
      ? `La categoria ${activeCategory} todavia no tiene productos disponibles.`
      : "Aun no hay productos publicados. Vuelve pronto para ver la nueva coleccion.";

  return (
    <div className="catalog-shell catalog-shell--empty">
      <section className="section-card section-card--spotlight">
        <div className="section-heading">
          <div>
            <p className="section-label">{activeSearch ? "Busqueda inteligente" : "Catalogo renovado"}</p>
            <h1>{pagination.total ? `${pagination.total} producto(s) disponible(s)` : "Muy pronto tendremos nuevos productos"}</h1>
          </div>
        </div>

        <p className="muted-text">
          {activeSearch
            ? `Resultados para "${activeSearch}". El buscador revisa nombre, marca, categoria, descripcion y tags.`
            : "Explora productos publicados. Cuando una categoria aun no tenga productos, aparecera como proximamente."}
        </p>

        <div className="pill-row">
          <button type="button" className={`pill${!activeCategory ? " is-active" : ""}`} onClick={() => updateCategory("")}>
            Todas las categorias
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`pill${activeCategory === category.slug ? " is-active" : ""}`}
              onClick={() => updateCategory(category.slug)}
            >
              {category.nombre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="product-grid product-grid--loading">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton-card" />)}
          </div>
        ) : products.length ? (
          <ProductCarousel label="Productos del catalogo">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                busy={busyProductId === product.id}
                onAddToCart={addProductToCart}
                onBuyNow={buyProductNow}
              />
            ))}
          </ProductCarousel>
        ) : (
          <div className="empty-state empty-state--premium">
            <strong>{emptyTitle}</strong>
            <span>{emptyText}</span>
          </div>
        )}

        {message && <p className="inline-message">{message}</p>}
      </section>
    </div>
  );
}
