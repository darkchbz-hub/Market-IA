export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  return res.status(status).json({
    message: error.message || "Ocurrio un error inesperado.",
    details: error.details || null
  });
}
