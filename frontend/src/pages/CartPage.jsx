import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  return (
    <div className="page-section page-section--spaced">
      <div className="section-header">
        <div>
          <p className="section-label">Carrito</p>
          <h1>Revisa tus productos antes de pagar</h1>
        </div>
      </div>

      <div className="cart-layout">
        <section className="card">
          {loading && <p className="inline-message">Sincronizando carrito...</p>}

          {cart.items.length ? (
            <div className="list-stack">
              {cart.items.map((item) => (
                <article key={item.productoId} className="cart-item">
                  <img src={item.imagenes?.[0]} alt={item.nombre} />
                  <div className="cart-item__body">
                    <strong>{item.nombre}</strong>
                    <p>{item.descripcion}</p>
                    <small>{item.categoria}</small>
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
                    <strong>${item.subtotal.toFixed(2)}</strong>
                    <button type="button" className="button button--light" onClick={() => removeItem(item.productoId)}>
                      Quitar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Tu carrito esta vacio.</p>
              <Link to="/" className="button button--primary">
                Ir al catalogo
              </Link>
            </div>
          )}
        </section>

        <aside className="card summary-card">
          <p className="section-label">Resumen</p>
          <h2>${cart.total.toFixed(2)}</h2>
          <p>{cart.items.length} productos listos para checkout.</p>
          <Link to="/checkout" className={`button button--primary ${!cart.items.length ? "is-disabled" : ""}`}>
            Continuar compra
          </Link>
        </aside>
      </div>
    </div>
  );
}
