import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const FALLBACK_IMAGE = "/assets/gray-c-shop-logo.png?v=20260514-2";

export function CartPage() {
  const navigate = useNavigate();
  const { cart, loading, updateQuantity, removeItem } = useCart();

  return (
    <div className="page-stack">
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Carrito</p>
            <h1>Revisa tu pedido antes de finalizar la compra</h1>
          </div>
        </div>
      </section>

      <div className="cart-layout">
        <section className="section-card">
          {loading && <p className="inline-message">Sincronizando carrito...</p>}

          {cart.items.length ? (
            <div className="cart-list">
              {cart.items.map((item) => (
                <article key={item.productoId} className="cart-item">
                  <img src={item.imagenes?.[0] || FALLBACK_IMAGE} alt={item.nombre} />
                  <div className="cart-item__body">
                    <strong>{item.nombre}</strong>
                    {item.variante?.color?.nombre && (
                      <small className="cart-item__variant">
                        Color: <span style={{ background: item.variante.color.hex || "#cbd5e1" }} /> {item.variante.color.nombre}
                      </small>
                    )}
                  </div>
                  <div className="cart-item__pricing">
                    <strong>${item.precio.toFixed(2)}</strong>
                    {item.cantidad > 1 && <span>{item.cantidad} pzas. | ${item.subtotal.toFixed(2)}</span>}
                  </div>
                  <div className="cart-item__controls">
                    <div className="quantity-control">
                      <button type="button" onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}>
                        -
                      </button>
                      <span>{item.cantidad}</span>
                      <button type="button" onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="button button--ghost" onClick={() => removeItem(item.productoId)}>
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Tu carrito esta vacio por ahora.</p>
              <Link to="/catalogo" className="button button--primary">
                Explorar productos
              </Link>
            </div>
          )}
        </section>

        <aside className="section-card order-summary">
          <p className="section-label">Resumen del pedido</p>
          <div className="summary-row">
            <span>Productos</span>
            <strong>{cart.items.length}</strong>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>${cart.total.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Envio</span>
            <strong>$0.00</strong>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <strong>${cart.total.toFixed(2)}</strong>
          </div>
          <button type="button" className="button button--primary" disabled={!cart.items.length} onClick={() => navigate("/checkout")}>
            Finalizar compra
          </button>
        </aside>
      </div>
    </div>
  );
}
