/**
 * server.js
 * -----------------------------------------------------------------------
 * Punto de entrada del backend de Nagomi Candles.
 * Expone la API REST que consume el frontend (carpeta raíz del repo):
 *   /api/products  -> catálogo
 *   /api/contact   -> formulario de contacto real
 *   /api/auth      -> login del panel admin
 *   /api/ai        -> IA personalizada (recomendador + chatbot)
 * -----------------------------------------------------------------------
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productsRouter = require("./routes/products");
const contactRouter = require("./routes/contact");
const authRouter = require("./routes/auth");
const aiRouter = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: permite que el frontend (por ejemplo, tu sitio en GitHub Pages)
// hable con esta API aunque esté en otro dominio.
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin.split(",") }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "nagomi-candles-backend" });
});

app.use("/api/products", productsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);

// Manejo simple de errores no atrapados en las rutas de arriba.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Algo salió mal en el servidor." });
});

app.listen(PORT, () => {
  console.log(`Nagomi Candles backend corriendo en http://localhost:${PORT}`);
});
