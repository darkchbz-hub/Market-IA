export function clampRating(value) {
  return Math.max(0, Math.min(5, Number(value || 0)));
}

export function RatingStars({ rating = 0, label, compact = false }) {
  const score = clampRating(rating);
  const percentage = `${(score / 5) * 100}%`;
  const accessibleLabel = label || `${score.toFixed(1)} de 5 estrellas`;

  return (
    <span className={`star-rating${compact ? " star-rating--compact" : ""}`} aria-label={accessibleLabel} title={accessibleLabel}>
      <span className="star-rating__base" aria-hidden="true">★★★★★</span>
      <span className="star-rating__fill" style={{ width: percentage }} aria-hidden="true">★★★★★</span>
    </span>
  );
}
