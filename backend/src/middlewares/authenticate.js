import { HttpError } from "../shared/http-error.js";
import { verifyAccessToken } from "../shared/tokens.js";

export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, "Token no proporcionado."));
  }

  try {
    req.auth = verifyAccessToken(token);
    return next();
  } catch {
    return next(new HttpError(401, "Token invalido o expirado."));
  }
}
