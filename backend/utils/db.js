/**
 * utils/db.js
 * -----------------------------------------------------------------------
 * Capa de acceso a datos. Usamos lowdb (una base de datos en un archivo
 * JSON) en lugar de MongoDB/Postgres para que el backend se pueda correr
 * en cualquier lado sin instalar un motor de base de datos aparte. Sigue
 * siendo una base de datos real: persiste en disco (data/db.json) y toda
 * la app le habla a través de este módulo, nunca leyendo el archivo
 * directamente desde otros lados.
 * -----------------------------------------------------------------------
 */
const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const bcrypt = require("bcryptjs");

const file = path.join(__dirname, "..", "data", "db.json");
const adapter = new FileSync(file);
const db = low(adapter);

// Semillas por defecto: catálogo inicial + usuario admin.
// Solo se insertan la primera vez que el servidor arranca (defaults()
// de lowdb no sobreescribe datos que ya existen en db.json).
const defaultProducts = [
  { id: "luna-lavanda", name: "Luna de Lavanda", scent: "lavanda", scentLabel: "Lavanda", desc: "Lavanda francesa y un toque de manzanilla, para las noches de episodio final y sueño profundo.", price: 18, stock: 12, wax: "#DCCBF3", jar: "#F1ECFB" },
  { id: "vainilla-astillero", name: "Vainilla del Astillero", scent: "vainilla", scentLabel: "Vainilla", desc: "Vainilla cálida con madera de sándalo, como el aroma de una cabaña de pescadores al atardecer.", price: 16, stock: 15, wax: "#FBE3B8", jar: "#FFF6E6" },
  { id: "sol-de-verano", name: "Sol de Verano", scent: "citrico", scentLabel: "Cítrico", desc: "Naranja, yuzu y un toque de jengibre: la energía de un festival de verano en la costa.", price: 15, stock: 20, wax: "#FFDA8E", jar: "#FFF3D9" },
  { id: "brisa-kaiju", name: "Brisa de Kaijū", scent: "oceano", scentLabel: "Océano", desc: "Sal marina, algas y un fondo de ozono fresco, inspirada en la niebla que cubre la bahía al amanecer.", price: 19, stock: 10, wax: "#A9DADD", jar: "#E6F5F5" },
  { id: "sakura-atardecer", name: "Sakura al Atardecer", scent: "floral", scentLabel: "Floral", desc: "Flor de cerezo y peonía suave, para esa escena rosa donde todo se siente posible.", price: 17, stock: 14, wax: "#F6C9DC", jar: "#FDEEF4" },
  { id: "matcha-zen", name: "Matcha Zen", scent: "matcha", scentLabel: "Té verde", desc: "Té verde ceremonial y bambú, un ritual de calma antes de empezar el día.", price: 16, stock: 18, wax: "#C7E7C0", jar: "#EDF7EA" },
  { id: "niebla-lunar", name: "Niebla Lunar", scent: "lavanda", scentLabel: "Lavanda", desc: "Lavanda, almizcle blanco y una gota de vainilla, como flotar entre nubes antes de dormir.", price: 20, stock: 9, wax: "#CBB9E9", jar: "#EFE7FB" },
  { id: "coral-susurrante", name: "Coral Susurrante", scent: "oceano", scentLabel: "Océano", desc: "Higo marino, sal y flor de loto: el fondo del mar contado como cuento de buenas noches.", price: 20, stock: 11, wax: "#8FCBCF", jar: "#E1F2F2" }
];

function seed() {
  const state = db.getState();
  const needsSeed = !state.products || !state.admin;

  if (needsSeed) {
    const adminUser = process.env.ADMIN_USER || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "nagomi2026";
    // La contraseña nunca se guarda en texto plano: se guarda su hash bcrypt.
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    db.defaults({
      products: defaultProducts,
      messages: [],
      admin: { username: adminUser, passwordHash }
    }).write();

    console.log(`Base de datos inicializada. Usuario admin: "${adminUser}"`);
  }
}

seed();

module.exports = db;
