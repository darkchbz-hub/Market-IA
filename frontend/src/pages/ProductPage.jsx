import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { ProductCarousel } from "../components/ProductCarousel.jsx";
import { RatingStars, clampRating } from "../components/RatingStars.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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

function getColorVariant(product) {
  return (Array.isArray(product?.variantes) ? product.variantes : []).find((variant) => variant?.tipo === "color") || null;
}

export function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setMessage("");

    apiFetch(`/products/${encodeURIComponent(productId)}`, { token })
      .then((payload) => {
        if (!active) return;
        setProduct(payload.product || null);
        setComments(payload.comments || []);
        setRelatedProducts(payload.relatedProducts || []);
        setSelectedImage(0);
        setQuantity(1);
        setSelectedColor(null);
        setShowAllTags(false);
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
  }, [productId, token]);

  const images = useMemo(() => {
    const productImages = safeList(product?.imagenes);
    return productImages.length ? productImages : [FALLBACK_IMAGE];
  }, [product]);

  const tags = useMemo(() => safeList(product?.tags), [product]);
  const visibleTags = showAllTags ? tags : tags.slice(0, 3);
  const features = useMemo(() => safeList(product?.caracteristicas), [product]);
  const colorOptions = useMemo(() => safeList(getColorVariant(product)?.opciones), [product]);
  const requiresColor = colorOptions.length > 0;
  const reviewAverage = useMemo(() => {
    const ratedComments = comments.map((comment) => clampRating(comment.rating)).filter((rating) => rating > 0);

    if (!ratedComments.length) {
      return clampRating(product?.ratingPromedio);
    }

    return ratedComments.reduce((total, rating) => total + rating, 0) / ratedComments.length;
  }, [comments, product]);
  const reviewCount = comments.length || Number(product?.ratingTotal || 0);
  const maxQuantity = Math.max(1, Math.min(Number(product?.stock || 1), 10));
  const canBuy = product && Number(product.stock || 0) > 0;

  const addProductToCart = async () => {
    if (!product) return;
    if (requiresColor && !selectedColor) {
      setMessage("Debes escoger un color antes de agregar este producto.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await addToCart(product.id, quantity, selectedColor ? { color: selectedColor } : {});
      setMessage(`${product.nombre} se agrego al carrito.`);
    } catch (cartError) {
      setMessage(cartError.message || "No se pudo agregar al carrito.");
    } finally {
      setBusy(false);
    }
  };

  const buyProductNow = async () => {
    if (!product) return;
    if (requiresColor && !selectedColor) {
      setMessage("Debes escoger un color antes de continuar con la compra.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await addToCart(product.id, quantity, selectedColor ? { color: selectedColor } : {});
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
              <img className="official-seller-badge__icon" src="/assets/verified-badge.png?v=20260628-clean" alt="" />
              <span>Vendedor oficial: {product.vendedorOficial}</span>
            </div>
          )}
          <div className="rating-row">
            <RatingStars rating={reviewAverage} label={`Promedio ${reviewAverage.toFixed(1)} de 5 estrellas`} />
            <strong>{reviewAverage.toFixed(1)} / 5</strong>
            <span>{reviewCount} opiniones</span>
            <span>{product.vendidos || 0} vendidos</span>
          </div>
          <p className="muted-text">{product.descripcionCorta || product.descripcion || "Producto publicado en catalogo."}</p>
          {tags.length > 0 && (
            <div className="product-tag-list">
              {visibleTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
              {tags.length > 3 && (
                <button type="button" className="product-tag-toggle" onClick={() => setShowAllTags((current) => !current)}>
                  {showAllTags ? "Ver menos" : "Ver mas..."}
                </button>
              )}
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
          <div className="trust-badge-grid trust-badge-grid--compact">
            <span>Entrega rapida</span>
            <span>Soporte por WhatsApp</span>
            <span>Pago seguro</span>
            <span>Garantia segun producto</span>
          </div>

          {requiresColor && (
            <div className={`product-color-picker${message.includes("color") && !selectedColor ? " needs-attention" : ""}`}>
              <strong>Selecciona un color</strong>
              <div className="product-color-grid">
                {colorOptions.map((color) => (
                  <button
                    key={color.nombre}
                    type="button"
                    className={`product-color-swatch${selectedColor?.nombre === color.nombre ? " is-selected" : ""}`}
                    onClick={() => {
                      setSelectedColor(color);
                      setMessage("");
                    }}
                    aria-label={`Color ${color.nombre}`}
                  >
                    <span style={{ background: color.hex || "#cbd5e1" }} />
                    <small>{color.nombre}</small>
                  </button>
                ))}
              </div>
              {selectedColor ? (
                <p className="selected-color-name">Color elegido: {selectedColor.nombre}</p>
              ) : (
                <p className="selected-color-name selected-color-name--warning">Debes escoger un color para continuar.</p>
              )}
            </div>
          )}

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

      <section className="product-detail-info product-detail-info--horizontal">
        <article className="detail-card product-info-row">
          <div className="product-info-row__head">
            <p className="section-label">Descripcion</p>
            <h2>Detalles del producto</h2>
          </div>
          <div className="product-info-row__body">
            <p className="muted-text">{product.descripcion || product.descripcionCorta || "Sin descripcion adicional por ahora."}</p>
          </div>
        </article>
        <article className="detail-card product-info-row">
          <div className="product-info-row__head">
            <p className="section-label">Caracteristicas</p>
            <h2>Lo mas importante</h2>
          </div>
          <div className="product-info-row__body">
            {features.length ? (
              <ul className="feature-list feature-list--inline feature-list--dash">
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">Este producto aun no tiene caracteristicas extra.</p>
            )}
          </div>
        </article>
        <article className="detail-card product-info-row">
          <div className="product-info-row__head">
            <p className="section-label">Compra segura</p>
            <h2>Envio y garantia</h2>
          </div>
          <div className="product-info-row__body shipping-info-row">
            <div className="shipping-info-item">
              <strong>Garantia</strong>
              <p className="muted-text">{product.garantia || "Garantia segun condiciones del vendedor."}</p>
            </div>
            <div className="shipping-info-item">
              <strong>Envio y devoluciones</strong>
              <p className="muted-text">{product.devolucion || "Puedes contactar soporte para dudas sobre entrega o devoluciones."}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="section-label">Opiniones</p>
            <h2>Comentarios de clientes</h2>
          </div>
          <div className="review-summary">
            <RatingStars rating={reviewAverage} label={`Promedio ${reviewAverage.toFixed(1)} de 5 estrellas`} />
            <strong>{reviewAverage.toFixed(1)}</strong>
            <span>{reviewCount} reseñas</span>
          </div>
        </div>
        {comments.length ? (
          <div className="review-list">
            {comments.map((comment) => (
              <article key={comment.id} className="mini-item mini-item--wide">
                <div className="review-item__head">
                  <strong>{comment.nickname || comment.usuario || "Cliente"}</strong>
                  <span>
                    <RatingStars rating={comment.rating} label={`${Number(comment.rating || 0).toFixed(1)} de 5 estrellas`} compact />
                    {Number(comment.rating || 0).toFixed(1)} / 5
                  </span>
                </div>
                <p>{comment.comentario}</p>
                {comment.imagenes?.length > 0 && (
                  <div className="review-image-grid">
                    {comment.imagenes.map((image, index) => (
                      <img key={`${comment.id}-${index}`} src={image} alt={`Imagen reseña ${index + 1}`} />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">Aun no hay opiniones para este producto.</p>
        )}
        {false ? (
          <form className="review-form" onSubmit={submitReview}>
            <label>
              Calificacion
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
            </label>
            <label>
              Tu opinion
              <textarea
                rows="3"
                value={reviewForm.comentario}
                onChange={(event) => setReviewForm((current) => ({ ...current, comentario: event.target.value }))}
                placeholder="Cuéntanos como fue tu experiencia con este producto"
              />
            </label>
            <button type="submit" className="button button--primary" disabled={busy}>
              Publicar opinion
            </button>
          </form>
        ) : (
          <p className="muted-text">Para escribir una reseña, entra a tu cuenta y abre el producto desde tu historial de compras.</p>
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
          <ProductCarousel label="Productos relacionados">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                busy={busy}
                onAddToCart={addRelatedToCart}
                onBuyNow={buyRelatedNow}
              />
            ))}
          </ProductCarousel>
        </section>
      )}
    </div>
  );
}
