const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const db = require("../utils/db");
const router = express.Router();

router.post("/", (req, res) => {
  const { name, rating, comment } = req.body || {};
  const score = Number(rating);
  if (!name || name.trim().length < 2 || !Number.isInteger(score) || score < 1 || score > 5 || !comment || comment.trim().length < 5) {
    return res.status(400).json({ error: "Escribe tu nombre, una calificación de 1 a 5 y un comentario de al menos 5 caracteres." });
  }
  const review = { id: Date.now().toString(36), name: name.trim().slice(0, 80), rating: score, comment: comment.trim().slice(0, 1000), approved: false, createdAt: new Date().toISOString() };
  db.get("reviews").push(review).write();
  res.status(201).json({ ok: true, message: "¡Gracias! Tu comentario quedó pendiente de revisión." });
});

router.get("/", (req, res) => {
  res.json(db.get("reviews").filter({ approved: true }).orderBy(["createdAt"], ["desc"]).value());
});

router.get("/admin", requireAdmin, (req, res) => {
  res.json(db.get("reviews").orderBy(["createdAt"], ["desc"]).value());
});

router.patch("/:id/approve", requireAdmin, (req, res) => {
  const review = db.get("reviews").find({ id: req.params.id });
  if (!review.value()) return res.status(404).json({ error: "Comentario no encontrado." });
  review.assign({ approved: Boolean(req.body.approved) }).write();
  res.json(review.value());
});

module.exports = router;
