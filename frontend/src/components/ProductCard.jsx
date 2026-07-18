import { Link } from "react-router-dom";
import { RatingStars } from "./RatingStars.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getShippingVisibilityText, getUserCountry } from "../lib/shipping.js";

const FALLBACK_IMAGE = "/assets/gray-c-shop-logo.png?v=20260514-2";

export function ProductCard({ product, onAddToCart, onBuyNow, busy }) {
  const { user } = useAuth();
  const hasOffer = Number(product.precioOriginal || 0) > Number(product.precio || 0);
  const rating = Number(product.ratingPromedio || 0);
  const shippingText = getShippingVisibilityText(getUserCountry(user), product);
  const requiresColor = (Array.isArray(product.variantes) ? product.variantes : []).some(
    (variant) => variant?.tipo === "color" && Array.isArray(variant.opciones) && variant.opciones.length
  );

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
            <img className="official-seller-badge__icon" src="/assets/verified-badge.png?v=20260628-clean" alt="" />
            <span>{product.vendedorOficial}</span>
          </div>
        )}
        <Link to={`/producto/${product.slug || product.id}`} className="product-card__title">
          {product.nombre}
        </Link>

        <div className="rating-row">
          <RatingStars rating={rating} label={`${rating.toFixed(1)} de 5 estrellas`} compact />
          <strong>{rating.toFixed(1)} / 5</strong>
          <span>{product.ratingTotal || 0} opiniones</span>
        </div>

        <div className="product-card__price">
          {hasOffer && <small className="product-card__price-original">${product.precioOriginal.toFixed(2)}</small>}
          <strong>${product.precio.toFixed(2)}</strong>
          {product.descuento > 0 && <span className="product-card__discount">{product.descuento}% off</span>}
        </div>

        <div className="product-card__shipping">
          <span><strong>Envio:</strong> {shippingText}</span>
          <small><strong>Fecha estimada:</strong> {product.fechaEstimada || "Entrega estimada variable"}</small>
        </div>
      </div>

      <div className="product-card__footer">
        <small>{product.stock} disponibles | {product.vendidos || 0} vendidos</small>
        <div className="product-card__actions">
          {requiresColor ? (
            <Link to={`/producto/${product.slug || product.id}`} className="button button--primary">
              Elegir color
            </Link>
          ) : (
            <>
              <button type="button" className="button button--ghost" onClick={() => onBuyNow?.(product)}>
                Comprar ahora
              </button>
              <button type="button" className="button button--primary" disabled={busy} onClick={() => onAddToCart?.(product)}>
                {busy ? "Agregando..." : "Agregar al carrito"}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
