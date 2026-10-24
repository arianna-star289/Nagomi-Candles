/**
 * middleware/auth.js
 * -----------------------------------------------------------------------
 * Protege rutas de administrador. Espera un header:
 *   Authorization: Bearer <token>
 * El token se emite en POST /api/auth/login y expira en 8 horas.
 * -----------------------------------------------------------------------
 */
const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No autorizado. Inicia sesión primero." });
  }

  try {
    const secret = process.env.JWT_SECRET || "dev-secret-nagomi";
    const payload = jwt.verify(token, secret);
    req.admin = payload; // { username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Tu sesión expiró o el token no es válido." });
  }
}

module.exports = { requireAdmin };
