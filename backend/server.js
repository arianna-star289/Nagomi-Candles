/**
 * server.js
 * -----------------------------------------------------------------------
 * Punto de entrada del backend de Nagomi Candles.
 * Expone la API REST que consume el frontend (carpeta raíz del repo):
 *   /api/products  -> catálogo
 *   /api/contact   -> formulario de contacto real
 *   /api/auth      -> login del panel admin y de clientes
 *   /api/ai        -> IA personalizada (recomendador + chatbot)
 *   /api/reviews   -> opiniones de clientes (moderadas por el admin)
 * -----------------------------------------------------------------------
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./utils/db");

const productsRouter = require("./routes/products");
const contactRouter = require("./routes/contact");
const authRouter = require("./routes/auth");
const aiRouter = require("./routes/ai");
const reviewsRouter = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: solo aceptamos peticiones de nuestro propio frontend.
// - En producción: el origen de GitHub Pages (variable CORS_ORIGIN en .env,
//   puede ser una lista separada por comas).
// - En desarrollo: Live Server de VS Code (puertos 5500/5501).
// Decisión técnica: no usamos "*" para que otras páginas no puedan
// usar nuestra API ni el chatbot (que podría tener costo por uso).
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, "")) // quita espacios y "/" final
  .filter(Boolean);

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push(
    "http://localhost:5500", "http://127.0.0.1:5500",
    "http://localhost:5501", "http://127.0.0.1:5501"
  );
}

app.use(cors({
  origin(origin, callback) {
    // Sin origen = Postman, curl o el propio servidor: se permite.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`CORS bloqueado para: ${origin}`);
    return callback(null, false); // el navegador bloquea la respuesta
  }
}));

// Limitamos el tamaño del cuerpo para que nadie envíe mensajes gigantes.
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "nagomi-candles-backend" });
});

app.use("/api/products", productsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/reviews", reviewsRouter);

// Ruta no encontrada: respondemos en JSON (el frontend siempre espera JSON).
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

// Manejo simple de errores no atrapados en las rutas de arriba.
app.use((err, req, res, next) => {
  console.error(err);
  // JSON mal formado enviado por el cliente
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Los datos enviados no son válidos." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "El mensaje es demasiado largo." });
  }
  res.status(500).json({ error: "Algo salió mal en el servidor." });
});

// Primero conectamos la base de datos y DESPUÉS empezamos a recibir
// peticiones; así ninguna ruta lee datos que todavía no se cargaron.
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Nagomi Candles backend corriendo en http://localhost:${PORT}`);
      console.log("Orígenes permitidos (CORS):", allowedOrigins.join(", ") || "ninguno");
    });
  })
  .catch((err) => {
    console.error("No se pudo iniciar la base de datos:", err.message);
    process.exit(1);
  });
