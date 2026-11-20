/**
 * utils/db.js
 * -----------------------------------------------------------------------
 * Capa de acceso a datos de Nagomi Candles.
 *
 * Toda la app usa la misma interfaz de lowdb (db.get("products")...),
 * pero DÓNDE se guardan los datos depende del entorno:
 *
 *   - Con MONGODB_URI (producción en Render): los datos viven en
 *     MongoDB Atlas, una base de datos en la nube. Así no se pierden
 *     cuando el plan gratis de Render reinicia o "duerme" el servidor
 *     (su disco se borra en cada reinicio).
 *   - Sin MONGODB_URI (desarrollo local): se guardan en data/db.json,
 *     como antes, sin instalar nada extra.
 *
 * Decisión técnica: en lugar de reescribir todas las rutas para Mongo,
 * mantenemos lowdb en memoria (lectura instantánea) y cada vez que una
 * ruta llama a .write(), guardamos una copia del estado completo en un
 * único documento de MongoDB. Para el tamaño de esta tienda (decenas de
 * velas y mensajes) es simple y suficiente; el límite de un documento
 * en MongoDB es 16 MB.
 * -----------------------------------------------------------------------
 */
const path = require("path");
const fs = require("fs");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const bcrypt = require("bcryptjs");

const DATA_FILE = path.join(__dirname, "..", "data", "db.json");
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "nagomi";
const DOC_ID = "main"; // id del documento que guarda todo el estado

// Semillas por defecto: catálogo inicial.
const defaultProducts = [
  { id: "luna-lavanda", name: "Luna de Lavanda", scent: "lavanda", scentLabel: "Lavanda", desc: "Lavanda francesa y un toque de manzanilla, para las noches de episodio final y sueño profundo.", price: 18, stock: 12, wax: "#DCCBF3", jar: "#F1ECFB" },
  { id: "vainilla-astillero", name: "Vainilla del Astillero", scent: "vainilla", scentLabel: "Vainilla", desc: "Vainilla cálida con madera de sándalo, como el aroma de una cabaña de pescadores al atardecer.", price: 16, stock: 15, wax: "#FBE3B8", jar: "#FFF6E6" },
  { id: "sol-de-verano", name: "Sol de Verano", scent: "citrico", scentLabel: "Cítrico", desc: "Naranja, yuzu y un toque de jengibre: la energía de un festival de verano en la costa.", price: 15, stock: 20, wax: "#FFDA8E", jar: "#FFF3D9" },
  { id: "brisa-kaiju", name: "Brisa de Kaiju", scent: "oceano", scentLabel: "Océano", desc: "Sal marina, algas y un fondo de ozono fresco, inspirada en la niebla que cubre la bahía al amanecer.", price: 19, stock: 10, wax: "#A9DADD", jar: "#E6F5F5" },
  { id: "sakura-atardecer", name: "Sakura al Atardecer", scent: "floral", scentLabel: "Floral", desc: "Flor de cerezo y peonía suave, para esa escena rosa donde todo se siente posible.", price: 17, stock: 14, wax: "#F6C9DC", jar: "#FDEEF4" },
  { id: "matcha-zen", name: "Matcha Zen", scent: "matcha", scentLabel: "Té verde", desc: "Té verde ceremonial y bambú, un ritual de calma antes de empezar el día.", price: 16, stock: 18, wax: "#C7E7C0", jar: "#EDF7EA" },
  { id: "niebla-lunar", name: "Niebla Lunar", scent: "lavanda", scentLabel: "Lavanda", desc: "Lavanda, almizcle blanco y una gota de vainilla, como flotar entre nubes antes de dormir.", price: 20, stock: 9, wax: "#CBB9E9", jar: "#EFE7FB" },
  { id: "coral-susurrante", name: "Coral Susurrante", scent: "oceano", scentLabel: "Océano", desc: "Higo marino, sal y flor de loto: el fondo del mar contado como cuento de buenas noches.", price: 20, stock: 11, wax: "#8FCBCF", jar: "#E1F2F2" }
];

// ---------------------------------------------------------------------
// Adaptador para MongoDB: lowdb trabaja en memoria y, en cada write(),
// mandamos el estado a Atlas en segundo plano.
// ---------------------------------------------------------------------
let collection = null;
let saving = false;
let pendingSave = false;

class MongoMirrorAdapter {
  read() { return {}; }               // el estado real se carga en init()
  write() { saveToMongo(); }          // guarda sin bloquear la respuesta
}

// Si llegan varias escrituras seguidas, no lanzamos muchas peticiones a
// la vez: guardamos una y, al terminar, otra con el estado más reciente.
async function saveToMongo() {
  if (!collection) return;
  if (saving) { pendingSave = true; return; }
  saving = true;
  try {
    do {
      pendingSave = false;
      const data = JSON.parse(JSON.stringify(db.getState()));
      await collection.replaceOne(
        { _id: DOC_ID },
        { _id: DOC_ID, data, updatedAt: new Date() },
        { upsert: true }
      );
    } while (pendingSave);
  } catch (err) {
    console.error("No se pudo guardar en MongoDB:", err.message);
  } finally {
    saving = false;
  }
}

const db = MONGODB_URI ? low(new MongoMirrorAdapter()) : low(new FileSync(DATA_FILE));

// ---------------------------------------------------------------------
// Administrador: el usuario y la contraseña SIEMPRE salen de las
// variables de entorno (.env en local, "Environment" en Render).
// Si cambias ADMIN_PASSWORD y reinicias, la nueva contraseña reemplaza
// a la anterior. Solo guardamos el hash (bcrypt), nunca la contraseña.
// ---------------------------------------------------------------------
function syncAdminFromEnv() {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const current = db.get("admin").value();

  if (!adminUser || !adminPassword || adminPassword.length < 12) {
    if (!current) {
      throw new Error("Configura ADMIN_USER y ADMIN_PASSWORD (mínimo 12 caracteres) en las variables de entorno antes de iniciar el backend.");
    }
    console.warn("ADMIN_USER/ADMIN_PASSWORD no configurados: se mantiene el administrador guardado.");
    return;
  }

  const upToDate = current && current.username === adminUser &&
    current.passwordHash && bcrypt.compareSync(adminPassword, current.passwordHash);

  if (!upToDate) {
    db.set("admin", { username: adminUser, passwordHash: bcrypt.hashSync(adminPassword, 12) }).write();
    console.log("Administrador actualizado desde las variables de entorno.");
  }
}

// ---------------------------------------------------------------------
// init(): se llama UNA vez desde server.js antes de aceptar peticiones.
// ---------------------------------------------------------------------
async function init() {
  if (MONGODB_URI) {
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    await client.connect();
    collection = client.db(MONGODB_DB).collection("store");

    const doc = await collection.findOne({ _id: DOC_ID });
    if (doc && doc.data) {
      db.setState(doc.data);
      console.log("Datos cargados desde MongoDB Atlas.");
    } else if (fs.existsSync(DATA_FILE)) {
      // Primera vez con Mongo: migramos lo que había en data/db.json.
      db.setState(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
      console.log("Primera conexión: datos migrados desde data/db.json a MongoDB.");
    } else {
      db.setState({});
      console.log("Primera conexión: base de datos nueva en MongoDB.");
    }
  }

  // Colecciones por defecto (no sobreescribe datos que ya existen).
  db.defaults({ products: defaultProducts, messages: [], users: [], reviews: [] }).write();
  syncAdminFromEnv();

  if (collection) await saveToMongo(); // asegura que Atlas tenga el estado inicial
  console.log(MONGODB_URI ? "Base de datos: MongoDB Atlas ☁️" : "Base de datos: archivo local data/db.json 💾");
}

db.init = init;
module.exports = db;
