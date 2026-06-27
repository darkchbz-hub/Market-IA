import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

const FALLBACK_IMAGE = "/assets/gray-c-shop-logo.png?v=20260514-2";

function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(Number(value || 0));
}

function safeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setMessage("");

    apiFetch(`/products/${encodeURIComponent(productId)}`)
      .then((payload) => {
        if (!active) return;
        setProduct(payload.product || null);
        setComments(payload.comments || []);
        setRelatedProducts(payload.relatedProducts || []);
        setSelectedImage(0);
        setQuantity(1);
      })
      .catch((requestError) => {
        if (!active) return;
        setProduct(null);
        setComments([]);
        setRelatedProducts([]);
        setError(requestError.message || "No se pudo cargar el producto.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [productId]);

  const images = useMemo(() => {
    const productImages = safeList(product?.imagenes);
    return productImages.length ? productImages : [FALLBACK_IMAGE];
  }, [product]);

  const tags = useMemo(() => safeList(product?.tags), [product]);
  const features = useMemo(() => safeList(product?.caracteristicas), [product]);
  const maxQuantity = Math.max(1, Math.min(Number(product?.stock || 1), 10));
  const canBuy = product && Number(product.stock || 0) > 0;

  const addProductToCart = async () => {
    if (!product) return;

    setBusy(true);
    setMessage("");
    try {
      await addToCart(product.id, quantity);
      setMessage(`${product.nombre} se agrego al carrito.`);
    } catch (cartError) {
      setMessage(cartError.message || "No se pudo agregar al carrito.");
    } finally {
      setBusy(false);
    }
  };

  const buyProductNow = async () => {
    if (!product) return;

    setBusy(true);
    setMessage("");
    try {
      await addToCart(product.id, quantity);
      navigate("/checkout");
    } catch (cartError) {
      setMessage(cartError.message || "No se pudo iniciar la compra.");
    } finally {
      setBusy(false);
    }
  };

  const addRelatedToCart = async (item) => {
    setBusy(true);
    try {
      await addToCart(item.id, 1);
      setMessage(`${item.nombre} se agrego al carrito.`);
    } catch (cartError) {
      setMessage(cartError.message || "No se pudo agregar al carrito.");
    } finally {
      setBusy(false);
    }
  };

  const buyRelatedNow = async (item) => {
    setBusy(true);
    try {
      await addToCart(item.id, 1);
      navigate("/checkout");
    } catch (cartError) {
      setMessage(cartError.message || "No se pudo iniciar la compra.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-stack">
        <section className="section-card product-detail-loading">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </section>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-stack">
        <section className="section-card status-card status-card--clean">
          <p className="section-label">Producto</p>
          <h1>No pudimos abrir este producto</h1>
          <p className="muted-text">{error || "El producto ya no esta disponible o cambio de direccion."}</p>
          <div className="hero-actions">
            <Link to="/catalogo" className="button button--primary">
              Volver al catalogo
            </Link>
            <Link to="/chat" className="button button--ghost">
              Contactar soporte
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="product-detail-shell">
        <article className="product-gallery">
          <div className="product-gallery__main">
            <img src={images[selectedImage] || FALLBACK_IMAGE} alt={product.nombre} />
          </div>
          {images.length > 1 && (
            <div className="product-gallery__thumbs" aria-label="Imagenes del producto">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={index === selectedImage ? "is-active" : ""}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.nombre} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="product-summary">
          <div className="product-detail-meta">
            <span>{product.categoria || "Producto"}</span>
            {product.marca && <span>{product.marca}</span>}
          </div>
          <h1>{product.nombre}</h1>
          {product.mostrarSelloOficial && product.vendedorOficial && (
            <div className="official-seller-badge" aria-label={`Vendedor oficial ${product.vendedorOficial}`}>
              <span className="official-seller-badge__check">V</span>
              <span>Vendedor oficial: {product.vendedorOficial}</span>
            </div>
          )}
          <div className="rating-row">
            <strong>{Number(product.ratingPromedio || 0).toFixed(1)} / 5</strong>
            <span>{product.ratingTotal || 0} opiniones</span>
            <span>{product.vendidos || 0} vendidos</span>
          </div>
          <p className="muted-text">{product.descripcionCorta || product.descripcion || "Producto publicado en catalogo."}</p>
          {tags.length > 0 && (
            <div className="product-tag-list">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </article>

        <aside className="purchase-panel">
          <p className="section-label">{canBuy ? "Disponible" : "Agotado"}</p>
          <div className="product-detail-price">
            {product.precioOriginal > product.precio && <small>{formatMoney(product.precioOriginal)}</small>}
            <strong>{formatMoney(product.precio)}</strong>
            {product.descuento > 0 && <span>{product.descuento}% off</span>}
          </div>
          <div className="purchase-panel__info">
            <span>{product.stock} disponibles</span>
            <span>{product.infoEnvio || "Envio nacional con seguimiento"}</span>
            <span>{product.fechaEstimada || "Entrega estimada variable"}</span>
          </div>

          <label className="quantity-picker">
            Cantidad
            <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} disabled={!canBuy}>
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <div className="product-summary__actions">
            <button type="button" className="button button--primary" disabled={!canBuy || busy} onClick={addProductToCart}>
              {busy ? "Agregando..." : "Agregar al carrito"}
            </button>
            <button type="button" className="button button--ghost" disabled={!canBuy || busy} onClick={buyProductNow}>
              Comprar ahora
            </button>
          </div>
          {message && <p className="inline-message">{message}</p>}
        </aside>
      </section>

      <section className="detail-columns product-detail-info">
        <article className="detail-card">
          <p className="section-label">Descripcion</p>
          <h2>Detalles del producto</h2>
          <p className="muted-text">{product.descripcion || product.descripcionCorta || "Sin descripcion adicional por ahora."}</p>
        </article>
        <article className="detail-card">
          <p className="section-label">Caracteristicas</p>
          <h2>Lo mas importante</h2>
          {features.length ? (
            <ul className="feature-list">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          ) : (
            <p className="muted-text">Este producto aun no tiene caracteristicas extra.</p>
          )}
        </article>
        <article className="detail-card">
          <p className="section-label">Compra segura</p>
          <h2>Envio y garantia</h2>
          <p className="muted-text">{product.garantia || "Garantia segun condiciones del vendedor."}</p>
          <p className="muted-text">{product.devolucion || "Puedes contactar soporte para dudas sobre entrega o devoluciones."}</p>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Opiniones</p>
            <h2>Comentarios de clientes</h2>
          </div>
        </div>
        {comments.length ? (
          <div className="review-list">
            {comments.map((comment) => (
              <article key={comment.id} className="mini-item mini-item--wide">
                <strong>{comment.nickname || comment.usuario || "Cliente"}</strong>
                <span>{Number(comment.rating || 0).toFixed(1)} / 5</span>
                <p>{comment.comentario}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">Aun no hay opiniones para este producto.</p>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <section className="section-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="section-label">Tambien podria gustarte</p>
              <h2>Productos relacionados</h2>
            </div>
          </div>
          <div className="product-grid">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                busy={busy}
                onAddToCart={addRelatedToCart}
                onBuyNow={buyRelatedNow}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
