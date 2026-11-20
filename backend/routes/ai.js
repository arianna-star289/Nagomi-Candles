/**
 * routes/ai.js
 * -----------------------------------------------------------------------
 * IA personalizada de Nagomi Candles.
 *
 * Funciona en dos niveles:
 *   1. IA GENERATIVA (Google Gemini): si existe GEMINI_API_KEY en .env,
 *      el chatbot usa un modelo de lenguaje real. Le enviamos un
 *      "prompt de sistema" con la personalidad de la marca, las políticas
 *      de la tienda y el CATÁLOGO REAL leído de la base de datos, así
 *      responde cualquier pregunta como si fuera Nagomi Candles.
 *   2. MOTOR DE REGLAS (respaldo): si no hay llave, si se acabó la cuota
 *      gratuita o si Gemini falla, respondemos con reglas escritas a mano.
 *      Así el chatbot nunca se queda sin responder.
 *
 * Decisión técnica: la llave de la IA vive SOLO en el backend (.env).
 * Si estuviera en el frontend, cualquiera podría verla y usarla.
 *
 *   POST /api/ai/recommend  -> { mood, intensity } => 1-2 velas del catálogo
 *   POST /api/ai/ask        -> { question }        => { answer, source }
 * -----------------------------------------------------------------------
 */
const express = require("express");
const db = require("../utils/db");

const router = express.Router();

const CONTACT_EMAIL = "ariannajibajaramirez@gmail.com";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_QUESTION_LENGTH = 500;

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function normalize(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function getProducts() {
  return db.get("products").value() || [];
}

// ---------------------------------------------------------------------
// Límite de uso: máximo 15 preguntas por minuto por visitante (IP).
// Protege la cuota gratuita de la IA si alguien abusa del chatbot.
// ---------------------------------------------------------------------
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || "desconocido";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 15) {
    return res.status(429).json({ error: "Vas muy rápido 🌊 Espera un momento y vuelve a preguntar." });
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
}

// ---------------------------------------------------------------------
// Recomendador por estado de ánimo (botones rápidos del chat)
// ---------------------------------------------------------------------
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

// Palabras que usa la gente al escribir libremente -> estado de ánimo.
const MOOD_KEYWORDS = {
  dormir: ["dormir", "sueno", "insomnio", "noche", "descansar"],
  relajarme: ["relaj", "estres", "ansiedad", "calma", "tranquil", "paz"],
  energizarme: ["energia", "animo", "despertar", "manana", "activ"],
  concentrarme: ["concentr", "estudiar", "trabajar", "enfoc", "leer"],
  celebrar: ["celebr", "regalo", "cumple", "fiesta", "aniversario", "romant"],
  viajar: [" mar", "playa", "oceano", "viaj", "costa"]
};

function recommendFor(mood, intensity) {
  const scents = MOOD_TO_SCENT[mood];
  let matches = getProducts().filter((p) => scents.includes(p.scent));
  // "intensa" prioriza las de mayor precio; "suave", las más ligeras.
  matches = matches.sort((a, b) => (intensity === "intensa" ? b.price - a.price : a.price - b.price));
  return matches.slice(0, 2);
}

router.post("/recommend", (req, res) => {
  const { mood, intensity } = req.body || {};
  if (!MOOD_TO_SCENT[mood]) {
    return res.status(400).json({
      error: "Cuéntame primero cómo te quieres sentir: relajarme, dormir, energizarme, concentrarme, celebrar o viajar."
    });
  }
  res.json({ message: MOOD_MESSAGE[mood], recommendations: recommendFor(mood, intensity) });
});

// ---------------------------------------------------------------------
// Nivel 1: IA generativa con Gemini
// ---------------------------------------------------------------------
function buildSystemPrompt() {
  const catalog = getProducts()
    .map((p) => `- ${p.name} (${p.scentLabel || p.scent}): ${p.desc} Precio: $${p.price}. Disponibles: ${p.stock ?? "consultar"}.`)
    .join("\n");

  return `Eres el asistente virtual de Nagomi Candles, una tienda de velas aromáticas artesanales de Ecuador inspiradas en el anime y el mar.
Eslogan: "respira el mar, enciende la calma". "Nagomi" (和み) significa en japonés esa paz suave que sientes cuando el mar está en calma.

TONO DE MARCA:
- Cálido, tranquilo y cercano. Tutea al cliente.
- Usa de vez en cuando metáforas de mar, calma o escenas de anime, sin exagerar.
- Respuestas cortas: máximo 4 frases. Máximo un emoji (🌊 o 🕯️).
- Escribe en texto plano, sin markdown, sin asteriscos ni listas con símbolos.

CATÁLOGO ACTUAL (usa SOLO estas velas, nombres y precios exactos):
${catalog}

INFORMACIÓN DE LA TIENDA:
- Todas las velas son de cera de soja natural con mecha de madera, hechas a mano en tandas pequeñas.
- Pedidos: desde el botón "Consultar" del catálogo o el formulario de Contacto.
- Envíos: se coordinan al confirmar el pedido; normalmente salen en 2 a 4 días hábiles.
- Devoluciones: si la vela llega dañada, escribir dentro de los primeros 7 días.
- Correo: ${CONTACT_EMAIL}. Instagram: @nagomicandles.

REGLAS:
- Si te piden una recomendación, sugiere 1 o 2 velas del catálogo y explica brevemente por qué encajan.
- Nunca inventes velas, precios, descuentos, tiempos ni políticas que no estén arriba. Si no sabes algo, invita a escribir a ${CONTACT_EMAIL}.
- Si te preguntan algo que no tiene que ver con velas o con la tienda, responde con amabilidad que solo puedes ayudar con Nagomi Candles.
- Si mencionan alergias, embarazo o asma, recomienda consultar antes de comprar y escribir a la tienda.`;
}

async function askGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null; // sin llave: usamos el motor de reglas

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
      })
    });

    if (!response.ok) {
      console.warn("Gemini respondió con error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    return text || null;
  } catch (err) {
    console.warn("No se pudo contactar a Gemini:", err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------
// Nivel 2: motor de reglas (respaldo)
// ---------------------------------------------------------------------
const FAQ_RULES = [
  {
    keywords: ["envio", "entrega", "domicilio", "cuanto tarda", "llega"],
    answer: `Los envíos se coordinan al confirmar tu pedido por el formulario de contacto o al correo ${CONTACT_EMAIL}. Normalmente se despachan en 2 a 4 días hábiles.`
  },
  {
    keywords: ["precio", "cuesta", "vale", "presupuesto", "cuanto es", "barata", "cara"],
    answer: "Nuestras velas van desde $15 hasta $20, según el aroma y el tamaño del frasco. Puedes ver todos los precios en el catálogo."
  },
  {
    keywords: ["ingrediente", "cera", "hecha de", "material", "alergia", "mecha"],
    answer: "Todas nuestras velas están hechas con cera de soja natural y mecha de madera. Si tienes alguna alergia, cuéntanos por el formulario de contacto antes de comprar."
  },
  {
    keywords: ["devolucion", "cambio", "garantia", "danad", "rota"],
    answer: `Si tu vela llega dañada o no es lo que esperabas, escríbenos dentro de los primeros 7 días a ${CONTACT_EMAIL} y lo resolvemos juntos.`
  },
  {
    keywords: ["aroma", "olor", "huele", "familias"],
    answer: "Tenemos seis familias de aroma: lavanda, vainilla, cítrico, océano, floral y té verde. Cuéntame cómo te quieres sentir y te recomiendo una."
  },
  {
    keywords: ["contacto", "hablar con alguien", "humano", "correo", "email", "instagram"],
    answer: `Claro, puedes escribirnos a ${CONTACT_EMAIL}, por Instagram a @nagomicandles o desde el formulario de Contacto.`
  },
  {
    keywords: ["hola", "buenas", "hey"],
    answer: "¡Hola! Soy el asistente de Nagomi Candles 🌊 Puedo ayudarte a elegir un aroma o resolver dudas sobre envíos, precios o ingredientes. ¿Qué necesitas?"
  }
];

function answerWithRules(question) {
  const text = normalize(question);

  // ¿La persona nombró una vela del catálogo?
  const product = getProducts().find((p) => text.includes(normalize(p.name)));
  if (product) {
    return `${product.name} (${product.scentLabel || product.scent}) cuesta $${product.price}. ${product.desc} 🕯️`;
  }

  // ¿Pide una recomendación según cómo se quiere sentir?
  const mood = Object.keys(MOOD_KEYWORDS).find((m) => MOOD_KEYWORDS[m].some((k) => text.includes(k)));
  if (mood) {
    const picks = recommendFor(mood, "suave");
    if (picks.length) {
      return `${MOOD_MESSAGE[mood]} Te recomiendo ${picks.map((p) => `${p.name} ($${p.price})`).join(" o ")}. 🕯️`;
    }
  }

  const rule = FAQ_RULES.find((r) => r.keywords.some((k) => text.includes(k)));
  if (rule) return rule.answer;

  return `No estoy seguro de esa pregunta todavía, pero puedes escribirnos a ${CONTACT_EMAIL} y te respondemos con calma 🕯️`;
}

// ---------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------
router.post("/ask", rateLimit, async (req, res) => {
  const { question } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Escribe una pregunta." });
  }
  const clean = question.trim().slice(0, MAX_QUESTION_LENGTH);

  const aiAnswer = await askGemini(clean);
  if (aiAnswer) return res.json({ answer: aiAnswer, source: "ia" });

  res.json({ answer: answerWithRules(clean), source: "reglas" });
});

module.exports = router;
