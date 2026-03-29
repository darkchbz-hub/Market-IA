import { HttpError } from "../shared/http-error.js";

export function requireRole(role) {
  return function roleMiddleware(req, _res, next) {
    if (!req.auth || req.auth.role !== role) {
      return next(new HttpError(403, "No tienes permisos para esta accion."));
    }

    return next();
  };
}
