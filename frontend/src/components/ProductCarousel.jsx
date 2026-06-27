import { useRef } from "react";

export function ProductCarousel({ children, label = "Productos" }) {
  const trackRef = useRef(null);

  const scroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    const distance = Math.max(320, Math.floor(track.clientWidth * 0.82));
    track.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div className="product-carousel" aria-label={label}>
      <button type="button" className="product-carousel__arrow product-carousel__arrow--left" onClick={() => scroll(-1)} aria-label="Ver productos anteriores">
        {"<"}
      </button>
      <div className="product-carousel__track" ref={trackRef}>
        {children}
      </div>
      <button type="button" className="product-carousel__arrow product-carousel__arrow--right" onClick={() => scroll(1)} aria-label="Ver mas productos">
        {">"}
      </button>
    </div>
  );
}
