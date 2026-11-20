/**
 * routes/products.js
 * -----------------------------------------------------------------------
 * Catálogo de velas.
 *   GET    /api/products        -> público, cualquiera puede ver el catálogo
 *   GET    /api/products/:id    -> público, detalle de una vela
 *   POST   /api/products        -> protegido (admin) crear vela nueva
 *   PUT    /api/products/:id    -> protegido (admin) editar vela
 *   DELETE /api/products/:id    -> protegido (admin) eliminar vela
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const db = require("../utils/db");

const router = express.Router();

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.get("/", (req, res) => {
  const { scent } = req.query;
  let products = db.get("products").value();
  if (scent && scent !== "todos") {
    products = products.filter((p) => p.scent === scent);
  }
  res.json(products);
});

router.get("/:id", (req, res) => {
  const product = db.get("products").find({ id: req.params.id }).value();
  if (!product) return res.status(404).json({ error: "Vela no encontrada." });
  res.json(product);
});

router.post("/", requireAdmin, (req, res) => {
  const { name, scent, scentLabel, desc, price, stock, wax, jar } = req.body || {};

  if (!name || !scent || !price) {
    return res.status(400).json({ error: "Nombre, aroma y precio son obligatorios." });
  }

  const id = slugify(name);
  if (db.get("products").find({ id }).value()) {
    return res.status(409).json({ error: "Ya existe una vela con ese nombre." });
  }

  const newProduct = {
    id,
    name,
    scent,
    scentLabel: scentLabel || scent,
    desc: desc || "",
    price: Number(price),
    stock: Number(stock) || 0,
    wax: wax || "#DCCBF3",
    jar: jar || "#F1ECFB"
  };

  db.get("products").push(newProduct).write();
  res.status(201).json(newProduct);
});

router.put("/:id", requireAdmin, (req, res) => {
  const product = db.get("products").find({ id: req.params.id });
  if (!product.value()) return res.status(404).json({ error: "Vela no encontrada." });

  const allowedFields = ["name", "scent", "scentLabel", "desc", "price", "stock", "wax", "jar"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.stock !== undefined) updates.stock = Number(updates.stock);

  product.assign(updates).write();
  res.json(product.value());
});

router.delete("/:id", requireAdmin, (req, res) => {
  const exists = db.get("products").find({ id: req.params.id }).value();
  if (!exists) return res.status(404).json({ error: "Vela no encontrada." });

  db.get("products").remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

module.exports = router;
