import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiFetch } from "../lib/api.js";

function renderStars(rating = 0) {
  const rounded = Math.round(rating);
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");
}

export function ProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: "5", comentario: "" });
  const [questionForm, setQuestionForm] = useState({ pregunta: "" });

  useEffect(() => {
    let active = true;

    apiFetch(`/products/${productId}`)
      .then((response) => {
        if (active) {
          setProduct(response.product);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product || !isAuthenticated || !token) {
      return;
    }

    apiFetch(`/products/${product.id}/view`, {
      method: "POST",
      token
    }).catch(() => {});
  }, [product, isAuthenticated, token]);

  const mainImage = useMemo(() => product?.imagenes?.[activeImage] || product?.imagenes?.[0] || "", [product, activeImage]);

  const handleAddToCart = async () => {
    if (!product) {
      return false;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return false;
    }

    setBusyId(product.id);
    setMessage("");

    try {
      await addToCart(product.id, 1);
      setMessage(`${product.nombre} se agrego al carrito.`);
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setBusyId("");
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    try {
      await apiFetch(`/products/${product.id}/reviews`, {
        method: "POST",
        token,
        body: {
          rating: Number(reviewForm.rating),
          comentario: reviewForm.comentario
        }
      });

      const refreshed = await apiFetch(`/products/${productId}`);
      setProduct(refreshed.product);
      setReviewForm({ rating: "5", comentario: "" });
      setMessage("Reseña guardada correctamente.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();

    try {
      await apiFetch(`/products/${product.id}/questions`, {
        method: "POST",
        token,
        body: questionForm
      });

      const refreshed = await apiFetch(`/products/${productId}`);
      setProduct(refreshed.product);
      setQuestionForm({ pregunta: "" });
      setMessage("Pregunta enviada correctamente.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (!product) {
    return <div className="page-loader">{message || "Cargando producto..."}</div>;
  }

  return (
    <div className="page-stack">
      {message && <p className="inline-message">{message}</p>}

      <section className="product-detail-shell">
        <div className="product-gallery">
          <div className="product-gallery__thumbs">
            {product.imagenes.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`product-gallery__thumb${activeImage === index ? " is-active" : ""}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={image} alt={`${product.nombre} ${index + 1}`} />
              </button>
            ))}
          </div>
          <div className="product-gallery__main">
            <img src={mainImage} alt={product.nombre} />
          </div>
        </div>

        <div className="product-summary">
          <p className="section-label">{product.categoria}</p>
          <h1>{product.nombre}</h1>
          <div className="rating-row">
            <strong>{renderStars(product.ratingPromedio)}</strong>
            <span>
              {Number(product.ratingPromedio || 0).toFixed(1)} · {product.totalOpiniones || 0} opiniones verificadas
            </span>
          </div>
          <p className="muted-text">{product.descripcionCorta || product.descripcion}</p>

          <div className="product-price-box">
            {product.precioAnterior > product.precio && <small>${product.precioAnterior.toFixed(2)}</small>}
            <strong>${product.precio.toFixed(2)}</strong>
            {product.descuento > 0 && <span>{product.descuento}% de descuento</span>}
          </div>

          <div className="product-summary__info">
            <span>Marca: {product.marca || "Gray C Shop"}</span>
            <span>Stock: {product.stock}</span>
            <span>Estado: {product.disponibilidad}</span>
            <span>Entrega: {product.fechaEstimada || "Por confirmar"}</span>
            <span>Envio: {product.infoEnvio || "Envio nacional con seguimiento"}</span>
            <span>Garantia: {product.garantia || "Garantia segun producto"}</span>
          </div>

          <div className="product-summary__actions">
            <button type="button" className="button button--primary" disabled={busyId === product.id} onClick={handleAddToCart}>
              {busyId === product.id ? "Agregando..." : "Agregar al carrito"}
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={async () => {
                const added = await handleAddToCart();
                if (added) {
                  navigate("/checkout");
                }
              }}
            >
              Comprar ahora
            </button>
          </div>

          <div className="pill-row">
            {(product.metodosPago || []).map((method) => (
              <span key={method} className="pill pill--small">
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Descripcion y caracteristicas</p>
            <h2>Detalles del producto</h2>
          </div>
        </div>
        <div className="detail-columns">
          <article className="detail-card">
            <h3>Descripcion</h3>
            <p>{product.descripcion}</p>
          </article>
          <article className="detail-card">
            <h3>Caracteristicas</h3>
            <ul className="feature-list">
              {(product.atributos || []).map((attribute, index) => (
                <li key={`${attribute.nombre}-${index}`}>
                  <strong>{attribute.nombre}:</strong> {attribute.valor}
                </li>
              ))}
            </ul>
          </article>
          <article className="detail-card">
            <h3>Variantes</h3>
            <ul className="feature-list">
              {(product.variantes || []).map((variant, index) => (
                <li key={`${variant.tipo}-${index}`}>
                  <strong>{variant.tipo}:</strong> {(variant.opciones || []).join(", ")}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Reseñas verificadas</p>
            <h2>Opiniones de compradores</h2>
          </div>
        </div>
        <div className="community-grid">
          <div className="community-list">
            {product.reviews.map((review) => (
              <article key={review.id} className="community-card">
                <div className="community-card__head">
                  <strong>{review.usuario.nickname ? `${review.usuario.nombre} /${review.usuario.nickname}` : review.usuario.nombre}</strong>
                  <span>{renderStars(review.rating)}</span>
                </div>
                <small>{new Date(review.fecha).toLocaleDateString()}</small>
                <p>{review.comentario}</p>
              </article>
            ))}
          </div>

          <form className="detail-card" onSubmit={handleReviewSubmit}>
            <h3>Deja tu reseña</h3>
            <label>
              Calificacion
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </label>
            <label>
              Comentario
              <textarea
                rows="5"
                value={reviewForm.comentario}
                onChange={(event) => setReviewForm((current) => ({ ...current, comentario: event.target.value }))}
              />
            </label>
            <button type="submit" className="button button--primary">
              Publicar reseña
            </button>
          </form>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Preguntas y respuestas</p>
            <h2>Resuelve dudas antes de comprar</h2>
          </div>
        </div>
        <div className="community-grid">
          <div className="community-list">
            {product.questions.map((question) => (
              <article key={question.id} className="community-card">
                <strong>{question.usuario.nickname ? `${question.usuario.nombre} /${question.usuario.nickname}` : question.usuario.nombre}</strong>
                <p>{question.pregunta}</p>
                <small>{question.respuesta || "Pendiente de respuesta"}</small>
              </article>
            ))}
          </div>

          <form className="detail-card" onSubmit={handleQuestionSubmit}>
            <h3>Haz una pregunta</h3>
            <label>
              Tu pregunta
              <textarea
                rows="5"
                value={questionForm.pregunta}
                onChange={(event) => setQuestionForm({ pregunta: event.target.value })}
              />
            </label>
            <button type="submit" className="button button--primary">
              Enviar pregunta
            </button>
          </form>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Relacionados</p>
            <h2>Tambien puede interesarte</h2>
          </div>
        </div>
        <div className="product-grid">
          {product.relatedProducts.map((related) => (
            <ProductCard key={related.id} product={related} onAddToCart={() => {}} onBuyNow={() => {}} />
          ))}
        </div>
      </section>
    </div>
  );
}
