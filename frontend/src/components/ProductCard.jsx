export function ProductCard({ product, onAddToCart, onShowDetails, busy }) {
  return (
    <article className="product-card">
      <div className="product-card__image">
        <img src={product.imagenes?.[0]} alt={product.nombre} />
      </div>

      <div className="product-card__body">
        <p className="product-card__category">{product.categoria}</p>
        <h3>{product.nombre}</h3>
        <p>{product.descripcion}</p>
      </div>

      <div className="product-card__footer">
        <div>
          <strong>${product.precio.toFixed(2)}</strong>
          <span>{product.moneda}</span>
        </div>
        <small>{product.stock} disponibles</small>
      </div>

      <div className="product-card__actions">
        <button type="button" className="button button--light" onClick={() => onShowDetails(product)}>
          Ver detalle
        </button>
        <button type="button" className="button button--primary" disabled={busy} onClick={() => onAddToCart(product)}>
          {busy ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </article>
  );
}
