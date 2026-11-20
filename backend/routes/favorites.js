/**
 * routes/favorites.js
 * -----------------------------------------------------------------------
 * Favoritas de cada cliente, guardadas en su cuenta (en la base de datos)
 * para que las vea desde cualquier celular o computadora.
 *
 *   GET /api/favorites  -> protegido (cliente) lista de ids de velas
 *   PUT /api/favorites  -> protegido (cliente) reemplaza la lista
 *                          body: { ids: ["luna-lavanda", ...] }
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { requireCustomer } = require("../middleware/auth");
const db = require("../utils/db");

const router = express.Router();
const MAX_FAVORITES = 100;

function findUser(req, res) {
  const user = db.get("users").find({ id: req.customer.userId });
  if (!user.value()) {
    res.status(404).json({ error: "No encontramos tu cuenta. Vuelve a iniciar sesión." });
    return null;
  }
  return user;
}

router.get("/", requireCustomer, (req, res) => {
  const user = findUser(req, res);
  if (!user) return;
  res.json({ ids: user.value().favorites || [] });
});

router.put("/", requireCustomer, (req, res) => {
  const user = findUser(req, res);
  if (!user) return;

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length > MAX_FAVORITES || !ids.every((id) => typeof id === "string")) {
    return res.status(400).json({ error: "La lista de favoritas no es válida." });
  }

  // Guardamos solo velas que existen en el catálogo y sin repetidas.
  const existing = new Set(db.get("products").map("id").value());
  const clean = [...new Set(ids)].filter((id) => existing.has(id));

  user.assign({ favorites: clean }).write();
  res.json({ ids: clean });
});

module.exports = router;
