import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api.js";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");

  const activeCategory = useMemo(() => searchParams.get("category") || "", [searchParams]);

  useEffect(() => {
    apiFetch("/products/categories")
      .then((response) => setCategories(response.items || []))
      .catch((error) => {
        setCategories([]);
        setMessage(error.message || "No se pudieron cargar las categorias.");
      });
  }, []);

  const updateCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  return (
    <div className="catalog-shell catalog-shell--empty">
      <section className="section-card section-card--spotlight">
        <div className="section-heading">
          <div>
            <p className="section-label">Catalogo renovado</p>
            <h1>0 productos activos en esta etapa</h1>
          </div>
        </div>

        <p className="muted-text">
          El inventario fue retirado por completo para preparar una nueva temporada visual y comercial.
          La estructura esta lista para recibir productos con una presentacion mucho mas profesional.
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

        <div className="empty-state empty-state--premium">
          <strong>Catálogo en reconstruccion</strong>
          <span>
            {activeCategory
              ? `La categoria ${activeCategory} tambien quedo limpia para relanzamiento.`
              : "Todas las categorias estan limpias y listas para una nueva coleccion."}
          </span>
        </div>

        {message && <p className="inline-message">{message}</p>}
      </section>
    </div>
  );
}
