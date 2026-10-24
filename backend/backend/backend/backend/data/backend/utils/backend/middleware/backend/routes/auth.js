/**
 * routes/auth.js
 * -----------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../utils/db");

const router = express.Router();

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

  const secret = process.env.JWT_SECRET || "dev-secret-nagomi";
  const token = jwt.sign({ username: admin.username, role: "admin" }, secret, {
    expiresIn: "8h"
  });

  res.json({ token, username: admin.username });
});

module.exports = router;
