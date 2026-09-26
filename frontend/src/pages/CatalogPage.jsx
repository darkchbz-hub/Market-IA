import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { ProductCarousel } from "../components/ProductCarousel.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

function productCountLabel(total) {
  const count = Number(total || 0);
  if (count === 1) return "1 producto disponible";
  return `${count} productos disponibles`;
}

function DesktopProductRow({ row, busyProductId, onAddToCart, onBuyNow }) {
  const rowRef = useRef(null);
  const moveRow = (distance) => {
    rowRef.current?.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <div className="catalog-desktop-product-row">
      <button type="button" className="catalog-desktop-row-arrow catalog-desktop-row-arrow--left" aria-label="Ver productos anteriores" onClick={() => moveRow(-560)}>
        ‹
      </button>
      <div className="catalog-desktop-product-row__viewport" ref={rowRef}>
        <div className="catalog-desktop-product-row__track">
          {row.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              busy={busyProductId === product.id}
              onAddToCart={onAddToCart}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </div>
      <button type="button" className="catalog-desktop-row-arrow catalog-desktop-row-arrow--right" aria-label="Ver más productos" onClick={() => moveRow(560)}>
        ›
      </button>
    </div>
  );
}

export function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 24 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [visibleDesktopProducts, setVisibleDesktopProducts] = useState(20);
  const desktopLoadMoreRef = useRef(null);

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

    apiFetch("/products?limit=48")
      .then((response) => {
        if (active) setOfferProducts(response.items || []);
      })
      .catch(() => {
        if (active) setOfferProducts([]);
      });

    return () => {
      active = false;
    };
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

  useEffect(() => {
    setVisibleDesktopProducts(20);
  }, [activeCategory, activeSearch, products.length]);

  useEffect(() => {
    const target = desktopLoadMoreRef.current;
    if (!target || visibleDesktopProducts >= products.length || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleDesktopProducts((current) => Math.min(current + 10, products.length));
        }
      },
      { rootMargin: "0px 0px 180px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [products.length, visibleDesktopProducts]);

  const desktopProductRows = useMemo(() => {
    const rows = [];
    const visibleProducts = products.slice(0, visibleDesktopProducts);
    for (let index = 0; index < visibleProducts.length; index += 10) {
      rows.push(visibleProducts.slice(index, index + 10));
    }
    return rows;
  }, [products, visibleDesktopProducts]);

  const updateCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const showAvailableProducts = () => {
    setSearchParams(new URLSearchParams());
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

  const emptyTitle = activeSearch ? "Sin coincidencias por ahora" : "Muy pronto tendremos productos en esta categoria";
  const emptyText = activeSearch
    ? `No encontramos productos para "${activeSearch}". Prueba con menos letras, marca, categoria o tags.`
    : activeCategory
      ? "Mientras tanto, puedes explorar nuestras ofertas disponibles."
      : "Aun no hay productos publicados. Vuelve pronto para ver la nueva coleccion.";
  const highlightedOffers = useMemo(() => {
    const categoriesSeen = new Set();
    const actualOffers = offerProducts.filter((product) =>
      product.oferta || Number(product.descuento || 0) > 0 || Number(product.precioOriginal || 0) > Number(product.precio || 0)
    );

    return actualOffers.filter((product) => {
      const category = String(product.categoria || "otros").toLowerCase();
      if (categoriesSeen.has(category)) return false;
      categoriesSeen.add(category);
      return true;
    }).slice(0, 12);
  }, [offerProducts]);

  return (
    <div className={`catalog-shell catalog-shell--empty${categoryMenuOpen ? " catalog-shell--menu-open" : ""}`}>
      <button
        type="button"
        className="catalog-category-toggle"
        onClick={() => setCategoryMenuOpen(true)}
        aria-expanded={categoryMenuOpen}
        aria-controls="catalog-category-drawer"
      >
        <span aria-hidden="true">☰</span>
        Categorias
      </button>

      <aside id="catalog-category-drawer" className="catalog-category-drawer" aria-label="Categorias del catalogo">
        <div className="catalog-category-drawer__head">
          <div>
            <p className="section-label">Explorar</p>
            <strong>Categorias</strong>
          </div>
          <button type="button" className="catalog-category-drawer__close" onClick={() => setCategoryMenuOpen(false)} aria-label="Cerrar menu de categorias">
            ×
          </button>
        </div>
        <button
          type="button"
          className={`catalog-category-drawer__item${!activeCategory ? " is-active" : ""}`}
          onClick={() => updateCategory("")}
        >
          Todas las categorias
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`catalog-category-drawer__item${activeCategory === category.slug ? " is-active" : ""}`}
            onClick={() => updateCategory(category.slug)}
          >
            {category.nombre}
          </button>
        ))}
      </aside>

      <section className="section-card section-card--spotlight">
        <div className="section-heading">
          <div>
            <p className="section-label">{activeSearch ? "Busqueda inteligente" : "Catalogo renovado"}</p>
            <h1>{pagination.total ? productCountLabel(pagination.total) : "Muy pronto tendremos nuevos productos"}</h1>
          </div>
        </div>

        <div className="halloween-mobile-banner" aria-label="Temporada de Halloween">
          <span aria-hidden="true">🎃</span>
          <p><strong>Temporada Halloween</strong><small>Encuentra tus favoritos antes de que desaparezcan.</small></p>
          <span aria-hidden="true">🦇</span>
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
          <>
            <div className="catalog-desktop-product-scroll">
              <div className="catalog-desktop-product-grid" aria-label="Productos del catalogo">
                {desktopProductRows.map((row, rowIndex) => (
                  <DesktopProductRow
                    key={`desktop-row-${rowIndex}`}
                    row={row}
                    busyProductId={busyProductId}
                    onAddToCart={addProductToCart}
                    onBuyNow={buyProductNow}
                  />
                ))}
              </div>
            </div>
            {visibleDesktopProducts < products.length && (
              <div ref={desktopLoadMoreRef} className="catalog-desktop-load-more" aria-live="polite">
                <span>Desplaza hacia abajo para cargar 10 productos más</span>
              </div>
            )}
            <div className="catalog-mobile-products">
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
            </div>
          </>
        ) : (
          <div className="empty-state empty-state--premium">
            <strong>{emptyTitle}</strong>
            <span>{emptyText}</span>
            {(activeCategory || activeSearch) && (
              <button type="button" className="button button--primary" onClick={showAvailableProducts}>
                Ver productos disponibles
              </button>
            )}
          </div>
        )}

        {message && <p className="inline-message">{message}</p>}
      </section>

      {!!highlightedOffers.length && (
        <section className="section-card catalog-offers-showcase">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Ofertas de temporada</p>
              <h2>Descubre ofertas de distintas categorias</h2>
            </div>
          </div>
          <p className="muted-text">Una selección de promociones activas; desliza para descubrir más.</p>
          <ProductCarousel label="Ofertas destacadas">
            {highlightedOffers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                busy={busyProductId === product.id}
                onAddToCart={addProductToCart}
                onBuyNow={buyProductNow}
              />
            ))}
          </ProductCarousel>
        </section>
      )}
    </div>
  );
}
