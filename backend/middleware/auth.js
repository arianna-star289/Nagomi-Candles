/**
 * middleware/auth.js
 * -----------------------------------------------------------------------
 * Protege rutas privadas. Espera un header:
 *   Authorization: Bearer <token>
 *
 *   requireAdmin    -> solo el token del administrador (role "admin"),
 *                      emitido en POST /api/auth/login (expira en 8 h).
 *   requireCustomer -> solo el token de un cliente (role "customer"),
 *                      emitido al registrarse o iniciar sesión (7 días).
 *
 * Importante: los dos tokens se firman con la misma clave, por eso
 * revisamos el "role". Sin esa revisión, un cliente registrado podría
 * usar su token para editar el catálogo o leer los mensajes.
 * -----------------------------------------------------------------------
 */
const jwt = require("jsonwebtoken");

// Lee y verifica el token; devuelve el contenido o responde con error.
function readToken(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "No autorizado. Inicia sesión primero." });
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "El servidor no tiene configurada la clave JWT." });
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch (err) {
    res.status(401).json({ error: "Tu sesión expiró o el token no es válido." });
    return null;
  }
}

function requireAdmin(req, res, next) {
  const payload = readToken(req, res);
  if (!payload) return;
  if (payload.role !== "admin") {
    return res.status(403).json({ error: "Solo la administradora puede hacer esto." });
  }
  req.admin = payload; // { username, role }
  next();
}

function requireCustomer(req, res, next) {
  const payload = readToken(req, res);
  if (!payload) return;
  if (payload.role !== "customer" || !payload.userId) {
    return res.status(403).json({ error: "Inicia sesión con tu cuenta de cliente." });
  }
  req.customer = payload; // { userId, email, role }
  next();
}

module.exports = { requireAdmin, requireCustomer };
