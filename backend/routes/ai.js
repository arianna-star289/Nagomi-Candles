/**
 * routes/ai.js
 * -----------------------------------------------------------------------
 * IA personalizada de Nagomi Candles.
 * Es un motor de reglas escrito a mano (no depende de una API externa de
 * pago ni de una llave de API), pero está diseñado específicamente para
 * este negocio: conoce el catálogo real desde la base de datos, entiende
 * preguntas frecuentes del negocio y responde siempre en el tono de marca
 * (cálido, tranquilo, con metáforas de mar y calma).
 *
 *   POST /api/ai/recommend  -> recibe { mood, intensity } y devuelve
 *                              1-2 velas recomendadas del catálogo real
 *   POST /api/ai/ask        -> chatbot de preguntas frecuentes del negocio
 * -----------------------------------------------------------------------
 */
const express = require("express");
const db = require("../utils/db");

const router = express.Router();

// Mapea estados de ánimo a familias olfativas del catálogo.
const MOOD_TO_SCENT = {
  relajarme: ["lavanda", "matcha"],
  dormir: ["lavanda"],
  energizarme: ["citrico"],
  concentrarme: ["matcha", "citrico"],
  celebrar: ["floral", "vainilla"],
  viajar: ["oceano"]
};

const MOOD_MESSAGE = {
  relajarme: "Cuando el día pesa, una nota tranquila ayuda a bajar el volumen del mundo.",
  dormir: "Para dormir buscamos algo suave, casi un arrullo: lavanda pura, sin sobresaltos.",
  energizarme: "Si necesitas encender la energía, un cítrico despierta como el primer rayo de sol.",
  concentrarme: "Para enfocarte, algo limpio y constante que no distraiga, ideal de fondo mientras trabajas.",
  celebrar: "Para un momento especial, algo floral y dulce que se sienta como una escena importante.",
  viajar: "Si extrañas el mar o quieres sentirte en otro lugar, el océano siempre ayuda a viajar sin moverte."
};

router.post("/recommend", (req, res) => {
  const { mood, intensity } = req.body || {};
  const products = db.get("products").value();

  const scents = MOOD_TO_SCENT[mood];
  if (!scents) {
    return res.status(400).json({
      error: "Cuéntame primero cómo te quieres sentir: relajarme, dormir, energizarme, concentrarme, celebrar o viajar."
    });
  }

  let matches = products.filter((p) => scents.includes(p.scent));

  // "intensity" ajusta el orden: intensa prioriza precios/tamaños mayores,
  // suave prioriza los más ligeros — aquí simplificado por precio como proxy.
  if (intensity === "intensa") {
    matches = matches.sort((a, b) => b.price - a.price);
  } else {
    matches = matches.sort((a, b) => a.price - b.price);
  }

  const picks = matches.slice(0, 2);

  res.json({
    message: MOOD_MESSAGE[mood] || "Aquí tienes algo que puede acompañarte.",
    recommendations: picks
  });
});

// Reglas de palabras clave para el chatbot de preguntas frecuentes.
const FAQ_RULES = [
  {
    keywords: ["envio", "envío", "entrega", "domicilio", "cuanto tarda", "cuánto tarda"],
    answer: "Los envíos se coordinan directamente al confirmar tu pedido por el formulario de contacto o al correo ariannajibajaramirez@gmail.com — normalmente se despachan en 2 a 4 días hábiles."
  },
  {
    keywords: ["precio", "cuesta", "vale", "presupuesto", "cuanto es", "cuánto es"],
    answer: "Nuestras velas van desde $15 hasta $20, según el aroma y el tamaño del frasco. Puedes ver todos los precios en el catálogo."
  },
  {
    keywords: ["ingrediente", "cera", "hecha de", "material", "alergia"],
    answer: "Todas nuestras velas están hechas con cera de soja natural y mecha de madera. Si tienes alguna alergia específica, cuéntanos por el formulario de contacto antes de comprar."
  },
  {
    keywords: ["aroma", "olor", "huele", "que aromas", "qué aromas", "familias"],
    answer: "Tenemos seis familias de aroma: lavanda, vainilla, cítrico, océano, floral y té verde. Si me dices cómo te quieres sentir, te recomiendo una en el buscador de aromas."
  },
  {
    keywords: ["devolucion", "devolución", "cambio", "garantia", "garantía"],
    answer: "Si tu vela llega dañada o no es lo que esperabas, escríbenos dentro de los primeros 7 días a ariannajibajaramirez@gmail.com y lo resolvemos juntos."
  },
  {
    keywords: ["contacto", "hablar con alguien", "humano", "correo", "email"],
    answer: "Claro, puedes escribirnos directamente a ariannajibajaramirez@gmail.com o llenar el formulario de la sección de contacto."
  },
  {
    keywords: ["hola", "buenas", "hey"],
    answer: "¡Hola! Soy el asistente de Nagomi Candles 🌊 Puedo ayudarte a elegir un aroma, resolver dudas sobre envíos, precios o ingredientes. ¿Qué necesitas?"
  }
];

router.post("/ask", (req, res) => {
  const { question } = req.body || {};
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Escribe una pregunta." });
  }

  const normalized = question
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const rule = FAQ_RULES.find((r) =>
    r.keywords.some((k) => normalized.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
  );

  const answer = rule
    ? rule.answer
    : "No estoy seguro de esa pregunta todavía, pero puedes escribirnos directo a ariannajibajaramirez@gmail.com y te respondemos con calma 🕯️";

  res.json({ answer });
});

module.exports = router;
