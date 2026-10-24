/**
 * routes/contact.js
 * -----------------------------------------------------------------------
 * Formulario de contacto real.
 *   POST /api/contact       -> público, cualquiera puede enviar un mensaje
 *   GET  /api/contact       -> protegido (admin) ver todos los mensajes
 *   PATCH /api/contact/:id/read -> protegido (admin) marcar como leído
 * -----------------------------------------------------------------------
 */
const express = require("express");
const { requireAdmin } = require("../middleware/auth");
const db = require("../utils/db");

const router = express.Router();
const CONTACT_EMAIL = "ariannajibajaramirez@gmail.com";

router.post("/", (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Nombre, correo y mensaje son obligatorios." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Ese correo no parece válido." });
  }

  const entry = {
    id: Date.now().toString(36),
    name,
    email,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };

  db.get("messages").push(entry).write();
  res.status(201).json({ ok: true, contactEmail: CONTACT_EMAIL });
});

router.get("/", requireAdmin, (req, res) => {
  const messages = db.get("messages").orderBy(["createdAt"], ["desc"]).value();
  res.json(messages);
});

router.patch("/:id/read", requireAdmin, (req, res) => {
  const message = db.get("messages").find({ id: req.params.id });
  if (!message.value()) return res.status(404).json({ error: "Mensaje no encontrado." });
  message.assign({ read: true }).write();
  res.json(message.value());
});

module.exports = router;
