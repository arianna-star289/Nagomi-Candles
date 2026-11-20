/**
 * routes/auth.js
 * -----------------------------------------------------------------------
 * POST /api/auth/login  -> valida usuario/contraseña del admin y entrega
 * un JWT que el panel de administración guarda para las siguientes
 * peticiones protegidas (crear/editar/borrar velas, ver mensajes).
 * -----------------------------------------------------------------------
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../utils/db");

const router = express.Router();

// Registro e inicio de sesión de clientes; separado del administrador.


router.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || name.trim().length < 2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    return res.status(400).json({ error: "Completa nombre, correo válido y contraseña de al menos 8 caracteres." });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "El servidor no tiene configurada la clave JWT." });
  const normalizedEmail = email.trim().toLowerCase();
  if (db.get("users").find({ email: normalizedEmail }).value()) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
  }
  const user = { id: Date.now().toString(36), name: name.trim(), email: normalizedEmail, passwordHash: bcrypt.hashSync(password, 12), createdAt: new Date().toISOString() };
  db.get("users").push(user).write();
  const token = jwt.sign({ userId: user.id, email: user.email, role: "customer" }, secret, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/customer-login", (req, res) => {
  const { email, password } = req.body || {};
  const user = email ? db.get("users").find({ email: email.trim().toLowerCase() }).value() : null;
  if (!user || !password || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "El servidor no tiene configurada la clave JWT." });
  const token = jwt.sign({ userId: user.id, email: user.email, role: "customer" }, secret, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  const admin = db.get("admin").value();

  if (!admin || username !== admin.username) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const passwordMatches = bcrypt.compareSync(password, admin.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "El servidor no tiene configurada la clave JWT." });
  const token = jwt.sign({ username: admin.username, role: "admin" }, secret, {
    expiresIn: "8h"
  });

  res.json({ token, username: admin.username });
});

module.exports = router;
