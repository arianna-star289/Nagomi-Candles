/**
 * api.js
 * -----------------------------------------------------------------------
 * Capa de servicio del frontend. Todo el resto del código (main.js,
 * catalogo.js, contacto.js, admin-*.js) le pide datos a este archivo,
 * nunca hace fetch directamente. Eso permite que la app funcione en dos
 * modos con exactamente la misma interfaz para quien la usa:
 *
 *   1. MODO REAL: si el backend (server.js) responde, todo pasa por la
 *      API REST real: fetch, JWT, base de datos en disco.
 *   2. MODO DEMO: si no hay backend disponible (por ejemplo, viendo el
 *      sitio publicado solo en GitHub Pages), se simula la misma base
 *      de datos con localStorage, para que el sitio nunca se rompa.
 * -----------------------------------------------------------------------
 */
const NagomiAPI = (function () {
  const BASE = (window.NAGOMI_CONFIG && window.NAGOMI_CONFIG.API_BASE_URL) || "http://localhost:4000/api";
  const LOCAL_KEY = "nagomi_local_db_v1";
  const DEMO_ADMIN = { username: "admin", password: "nagomi2026" };

  let backendChecked = false;
  let backendAvailable = false;

  const DEFAULT_PRODUCTS = [
    { id: "luna-lavanda", name: "Luna de Lavanda", scent: "lavanda", scentLabel: "Lavanda", desc: "Lavanda francesa y un toque de manzanilla, para las noches de episodio final y sueño profundo.", price: 18, stock: 12, wax: "#DCCBF3", jar: "#F1ECFB" },
    { id: "vainilla-astillero", name: "Vainilla del Astillero", scent: "vainilla", scentLabel: "Vainilla", desc: "Vainilla cálida con madera de sándalo, como el aroma de una cabaña de pescadores al atardecer.", price: 16, stock: 15, wax: "#FBE3B8", jar: "#FFF6E6" },
    { id: "sol-de-verano", name: "Sol de Verano", scent: "citrico", scentLabel: "Cítrico", desc: "Naranja, yuzu y un toque de jengibre: la energía de un festival de verano en la costa.", price: 15, stock: 20, wax: "#FFDA8E", jar: "#FFF3D9" },
    { id: "brisa-kaiju", name: "Brisa de Kaijū", scent: "oceano", scentLabel: "Océano", desc: "Sal marina, algas y un fondo de ozono fresco, inspirada en la niebla que cubre la bahía al amanecer.", price: 19, stock: 10, wax: "#A9DADD", jar: "#E6F5F5" },
    { id: "sakura-atardecer", name: "Sakura al Atardecer", scent: "floral", scentLabel: "Floral", desc: "Flor de cerezo y peonía suave, para esa escena rosa donde todo se siente posible.", price: 17, stock: 14, wax: "#F6C9DC", jar: "#FDEEF4" },
    { id: "matcha-zen", name: "Matcha Zen", scent: "matcha", scentLabel: "Té verde", desc: "Té verde ceremonial y bambú, un ritual de calma antes de empezar el día.", price: 16, stock: 18, wax: "#C7E7C0", jar: "#EDF7EA" },
    { id: "niebla-lunar", name: "Niebla Lunar", scent: "lavanda", scentLabel: "Lavanda", desc: "Lavanda, almizcle blanco y una gota de vainilla, como flotar entre nubes antes de dormir.", price: 20, stock: 9, wax: "#CBB9E9", jar: "#EFE7FB" },
    { id: "coral-susurrante", name: "Coral Susurrante", scent: "oceano", scentLabel: "Océano", desc: "Higo marino, sal y flor de loto: el fondo del mar contado como cuento de buenas noches.", price: 20, stock: 11, wax: "#8FCBCF", jar: "#E1F2F2" }
  ];

  // ---------- almacenamiento local (modo demo) ----------
  function loadLocalDB() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage corrupto: se reinicia abajo */ }
    const fresh = { products: DEFAULT_PRODUCTS, messages: [] };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(fresh));
    return fresh;
  }
  function saveLocalDB(data) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }
  function slugify(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // ---------- detección de backend real ----------
  async function checkBackend() {
    if (backendChecked) return backendAvailable;
    backendChecked = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${BASE}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      backendAvailable = res.ok;
    } catch (e) {
      backendAvailable = false;
    }
    return backendAvailable;
  }

  function isDemoMode() {
    return backendChecked && !backendAvailable;
  }

  async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Ocurrió un error inesperado.");
    return data;
  }

  // ---------- productos ----------
  async function getProducts(scent) {
    await checkBackend();
    if (backendAvailable) {
      const query = scent && scent !== "todos" ? `?scent=${encodeURIComponent(scent)}` : "";
      return request(`/products${query}`);
    }
    const db = loadLocalDB();
    return scent && scent !== "todos" ? db.products.filter((p) => p.scent === scent) : db.products;
  }

  async function createProduct(payload, token) {
    await checkBackend();
    if (backendAvailable) {
      return request("/products", { method: "POST", body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } });
    }
    const db = loadLocalDB();
    const id = slugify(payload.name);
    if (db.products.some((p) => p.id === id)) throw new Error("Ya existe una vela con ese nombre.");
    const product = { id, scentLabel: payload.scent, wax: "#DCCBF3", jar: "#F1ECFB", ...payload, price: Number(payload.price), stock: Number(payload.stock) || 0 };
    db.products.push(product);
    saveLocalDB(db);
    return product;
  }

  async function updateProduct(id, payload, token) {
    await checkBackend();
    if (backendAvailable) {
      return request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } });
    }
    const db = loadLocalDB();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Vela no encontrada.");
    db.products[idx] = { ...db.products[idx], ...payload };
    saveLocalDB(db);
    return db.products[idx];
  }

  async function deleteProduct(id, token) {
    await checkBackend();
    if (backendAvailable) {
      return request(`/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    }
    const db = loadLocalDB();
    db.products = db.products.filter((p) => p.id !== id);
    saveLocalDB(db);
    return { ok: true };
  }

  // ---------- contacto ----------
  async function sendMessage(payload) {
    await checkBackend();
    if (backendAvailable) {
      return request("/contact", { method: "POST", body: JSON.stringify(payload) });
    }
    const db = loadLocalDB();
    db.messages.unshift({ id: Date.now().toString(36), ...payload, read: false, createdAt: new Date().toISOString() });
    saveLocalDB(db);
    return { ok: true, contactEmail: window.NAGOMI_CONFIG.CONTACT_EMAIL };
  }

  async function getMessages(token) {
    await checkBackend();
    if (backendAvailable) {
      return request("/contact", { headers: { Authorization: `Bearer ${token}` } });
    }
    const db = loadLocalDB();
    return db.messages;
  }

  async function markMessageRead(id, token) {
    await checkBackend();
    if (backendAvailable) {
      return request(`/contact/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    }
    const db = loadLocalDB();
    const msg = db.messages.find((m) => m.id === id);
    if (msg) msg.read = true;
    saveLocalDB(db);
    return msg;
  }

  // ---------- autenticación admin ----------
  async function login(username, password) {
    await checkBackend();
    if (backendAvailable) {
      return request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
    }
    if (username === DEMO_ADMIN.username && password === DEMO_ADMIN.password) {
      return { token: "demo-token", username, demo: true };
    }
    throw new Error("Usuario o contraseña incorrectos.");
  }

  // ---------- IA personalizada ----------
  const MOOD_TO_SCENT = {
    relajarme: ["lavanda", "matcha"], dormir: ["lavanda"], energizarme: ["citrico"],
    concentrarme: ["matcha", "citrico"], celebrar: ["floral", "vainilla"], viajar: ["oceano"]
  };
  const MOOD_MESSAGE = {
    relajarme: "Cuando el día pesa, una nota tranquila ayuda a bajar el volumen del mundo.",
    dormir: "Para dormir buscamos algo suave, casi un arrullo: lavanda pura, sin sobresaltos.",
    energizarme: "Si necesitas encender la energía, un cítrico despierta como el primer rayo de sol.",
    concentrarme: "Para enfocarte, algo limpio y constante que no distraiga, ideal de fondo mientras trabajas.",
    celebrar: "Para un momento especial, algo floral y dulce que se sienta como una escena importante.",
    viajar: "Si extrañas el mar o quieres sentirte en otro lugar, el océano siempre ayuda a viajar sin moverte."
  };
  const FAQ_RULES = [
    { keywords: ["envio", "entrega", "domicilio", "cuanto tarda"], answer: "Los envíos se coordinan al confirmar tu pedido por el formulario de contacto o al correo ariannajibajaramirez@gmail.com — normalmente se despachan en 2 a 4 días hábiles." },
    { keywords: ["precio", "cuesta", "vale", "presupuesto", "cuanto es"], answer: "Nuestras velas van desde $15 hasta $20, según el aroma y el tamaño del frasco. Puedes ver todos los precios en el catálogo." },
    { keywords: ["ingrediente", "cera", "hecha de", "material", "alergia"], answer: "Todas nuestras velas están hechas con cera de soja natural y mecha de madera. Si tienes alguna alergia específica, cuéntanos por el formulario de contacto." },
    { keywords: ["aroma", "olor", "huele", "que aromas", "familias"], answer: "Tenemos seis familias de aroma: lavanda, vainilla, cítrico, océano, floral y té verde. Cuéntame cómo te quieres sentir y te recomiendo una." },
    { keywords: ["devolucion", "cambio", "garantia"], answer: "Si tu vela llega dañada o no es lo que esperabas, escríbenos dentro de los primeros 7 días a ariannajibajaramirez@gmail.com y lo resolvemos juntos." },
    { keywords: ["contacto", "hablar con alguien", "humano", "correo", "email"], answer: "Claro, puedes escribirnos directamente a ariannajibajaramirez@gmail.com o llenar el formulario de la sección de contacto." },
    { keywords: ["hola", "buenas", "hey"], answer: "¡Hola! Soy el asistente de Nagomi Candles 🌊 Puedo ayudarte a elegir un aroma, resolver dudas sobre envíos, precios o ingredientes. ¿Qué necesitas?" }
  ];
  function normalize(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async function aiRecommend(mood, intensity) {
    await checkBackend();
    if (backendAvailable) {
      return request("/ai/recommend", { method: "POST", body: JSON.stringify({ mood, intensity }) });
    }
    const scents = MOOD_TO_SCENT[mood];
    if (!scents) throw new Error("Cuéntame primero cómo te quieres sentir.");
    const db = loadLocalDB();
    let matches = db.products.filter((p) => scents.includes(p.scent));
    matches = intensity === "intensa" ? matches.sort((a, b) => b.price - a.price) : matches.sort((a, b) => a.price - b.price);
    return { message: MOOD_MESSAGE[mood], recommendations: matches.slice(0, 2) };
  }

  async function aiAsk(question) {
    await checkBackend();
    if (backendAvailable) {
      return request("/ai/ask", { method: "POST", body: JSON.stringify({ question }) });
    }
    const normalized = normalize(question);
    const rule = FAQ_RULES.find((r) => r.keywords.some((k) => normalized.includes(normalize(k))));
    return { answer: rule ? rule.answer : "No estoy seguro de esa pregunta todavía, pero puedes escribirnos a ariannajibajaramirez@gmail.com y te respondemos con calma 🕯️" };
  }

  return {
    checkBackend, isDemoMode,
    getProducts, createProduct, updateProduct, deleteProduct,
    sendMessage, getMessages, markMessageRead,
    login, aiRecommend, aiAsk
  };
})();
