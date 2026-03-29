import { verifyAccessToken } from "../shared/tokens.js";

export function optionalAuthenticate(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    req.auth = verifyAccessToken(token);
  } catch {
    req.auth = null;
  }

  return next();
}
