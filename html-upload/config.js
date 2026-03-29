const defaultOrigin = window.location.protocol === "file:" ? "http://localhost:4000" : window.location.origin;

window.MARKETZONE_CONFIG = {
  apiUrl: `${defaultOrigin}/api`
};
