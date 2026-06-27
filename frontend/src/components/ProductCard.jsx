import { Link } from "react-router-dom";

const FALLBACK_IMAGE = "/assets/gray-c-shop-logo.png?v=20260514-2";

function renderRating(rating = 0) {
  return `${Number(rating || 0).toFixed(1)} / 5`;
}

export function ProductCard({ product, onAddToCart, onBuyNow, busy }) {
  return (
    <article className="product-card">
      <Link to={`/producto/${product.slug || product.id}`} className="product-card__image">
        {product.oferta && <span className="product-badge product-badge--sale">Oferta</span>}
        <img src={product.imagenes?.[0] || FALLBACK_IMAGE} alt={product.nombre} />
      </Link>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span>{product.categoria}</span>
          {product.marca && <span>{product.marca}</span>}
        </div>
        {product.mostrarSelloOficial && product.vendedorOficial && (
          <div className="official-seller-badge" aria-label={`Vendedor oficial ${product.vendedorOficial}`}>
            <span className="official-seller-badge__check">V</span>
            <span>{product.vendedorOficial}</span>
          </div>
        )}
        <Link to={`/producto/${product.slug || product.id}`} className="product-card__title">
          {product.nombre}
        </Link>

        <div className="rating-row">
          <strong>{renderRating(product.ratingPromedio || 0)}</strong>
          <span>{product.ratingTotal || 0} opiniones</span>
        </div>

        <div className="product-card__price">
          {product.precioOriginal > product.precio && <small>${product.precioOriginal.toFixed(2)}</small>}
          <strong>${product.precio.toFixed(2)}</strong>
          {product.descuento > 0 && <span>{product.descuento}% off</span>}
        </div>

        <div className="product-card__shipping">
          <span>{product.infoEnvio || "Envio nacional con seguimiento"}</span>
          <small>{product.fechaEstimada || "Entrega estimada variable"}</small>
        </div>
      </div>

      <div className="product-card__footer">
        <small>{product.stock} disponibles | {product.vendidos || 0} vendidos</small>
        <div className="product-card__actions">
          <button type="button" className="button button--ghost" onClick={() => onBuyNow?.(product)}>
            Comprar ahora
          </button>
          <button type="button" className="button button--primary" disabled={busy} onClick={() => onAddToCart?.(product)}>
            {busy ? "Agregando..." : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </article>
  );
}
