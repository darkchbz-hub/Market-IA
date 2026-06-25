import { Link } from "react-router-dom";

export function ProductPage() {
  return (
    <div className="page-stack">
      <section className="section-card status-card status-card--clean">
        <p className="section-label">Proximamente</p>
        <h1>Este producto aun no esta disponible</h1>
        <p className="muted-text">
          Estamos preparando nuevos productos con mejor presentacion y experiencia. Cuando esten listos, apareceran
          publicados en el catalogo.
        </p>

        <div className="hero-actions">
          <Link to="/catalogo" className="button button--primary">
            Ver proximamente
          </Link>
          <Link to="/chat" className="button button--ghost">
            Contactar soporte
          </Link>
        </div>
      </section>
    </div>
  );
}
