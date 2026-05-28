import { Link } from "react-router-dom";

export function ProductPage() {
  return (
    <div className="page-stack">
      <section className="section-card status-card status-card--clean">
        <p className="section-label">Inventario actualizado</p>
        <h1>Este producto ya no esta disponible</h1>
        <p className="muted-text">
          El catalogo anterior fue retirado para la gran renovacion de la tienda. Muy pronto publicaremos una nueva linea
          de productos con mejor presentacion y experiencia.
        </p>

        <div className="hero-actions">
          <Link to="/catalogo" className="button button--primary">
            Ver catalogo renovado
          </Link>
          <Link to="/chat" className="button button--ghost">
            Contactar soporte
          </Link>
        </div>
      </section>
    </div>
  );
}
