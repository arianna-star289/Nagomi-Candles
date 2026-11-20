# 🕯️ Nagomi Candles

*Respira el mar, enciende la calma.*

Nagomi Candles es una tienda en línea de velas aromáticas hechas a mano,
inspiradas en dos cosas que me encantan: el anime y el mar.

El nombre viene de una palabra japonesa, **nagomi** (和み), que describe esa
sensación de paz suave que sientes cuando el mar está tranquilo o cuando
termina un episodio que te dejó el corazón en calma. Quise que cada vela
se sintiera así.

Proyecto final de la **Ruta Avanzada de Jóvenes Creativos**: una aplicación
web full stack, publicada en internet y con inteligencia artificial
personalizada para el negocio.

---

## 🌐 Enlaces

| | Dirección |
|---|---|
| **Página publicada** (frontend) | https://arianna-star289.github.io/Nagomi-Candles/ |
| **API publicada** (backend) | https://nagomi-candles-api.onrender.com/api/health |
| **Repositorio** | https://github.com/arianna-star289/Nagomi-Candles |

> El servidor usa el plan gratuito de Render: si nadie lo visita en 15
> minutos se "duerme" y la primera visita puede tardar hasta un minuto en
> cargar. Después funciona con normalidad.

---

## ✨ ¿Qué se puede hacer?

**Para los clientes**
- **Conocer la marca** en la página de inicio.
- **Ver el catálogo** y filtrar las velas por aroma: lavanda, vainilla,
  cítrico, océano, floral y té verde.
- **Guardar favoritas** con el corazón ♡ y ver solo esas.
- **Pedir por WhatsApp**: cada vela tiene un botón que abre WhatsApp con el
  pedido ya escrito (nombre de la vela y precio).
- **Escribirnos** desde el formulario de contacto o por WhatsApp.
- **Dejar una opinión**, que se publica cuando la tienda la aprueba.
- **Crear una cuenta** e iniciar sesión.
- **Preguntarle al asistente con IA** (botón 🌊): recomienda velas según cómo
  te quieras sentir y responde dudas sobre envíos, precios o ingredientes.

**Para la administradora** (panel privado con usuario y contraseña)
- Crear, editar y eliminar velas del catálogo.
- Leer los mensajes de contacto y marcarlos como leídos.
- Aprobar u ocultar las opiniones de los clientes.

---

## 🧱 Tecnologías

| Parte | Tecnología | Para qué |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | Páginas, estilos y comportamiento |
| Frontend | React 18 (por CDN, sin compilar) | Catálogo con filtros, favoritas y estados de carga |
| Backend | Node.js + Express | API REST |
| Base de datos | MongoDB Atlas (en la nube) | Guardar velas, mensajes, cuentas y opiniones |
| Seguridad | JWT + bcrypt | Sesiones del admin y contraseñas cifradas |
| IA | Google Gemini | Chatbot que conoce el catálogo y habla como la marca |
| Publicación | GitHub Pages + Render | Frontend y backend en internet |

---

## 🗺️ Cómo funciona (arquitectura)

```
 Navegador del cliente
        │
        ▼
 ┌─────────────────────────┐        ┌──────────────────────────┐
 │  FRONTEND               │  HTTPS │  BACKEND (Render)        │
 │  GitHub Pages           │ ─────► │  Node.js + Express       │
 │  HTML, CSS, JS, React   │  JSON  │  /api/products, /contact │
 │                         │ ◄───── │  /auth, /ai, /reviews    │
 └─────────────────────────┘        └──────┬──────────┬────────┘
                                           │          │
                                           ▼          ▼
                                  ┌──────────────┐ ┌────────────────┐
                                  │ MongoDB Atlas│ │ Google Gemini  │
                                  │ (datos)      │ │ (IA del chat)  │
                                  └──────────────┘ └────────────────┘
```

- El **frontend** nunca habla directo con la base de datos ni con la IA:
  todo pasa por el **backend**. Así las claves secretas no quedan expuestas
  en el navegador.
- Todo el frontend pide datos a través de un solo archivo,
  `assets/js/api.js`. Si el backend no responde, la página sigue funcionando
  en **modo demostración** (con datos guardados en el navegador) y muestra
  un aviso, para que nunca se vea vacía o rota.

---

## 📁 Estructura del proyecto

```
Nagomi-Candles/
├── index.html            → página de inicio (marca)
├── catalogo.html         → catálogo en React
├── contacto.html         → formulario de contacto y opiniones
├── cuenta.html           → registro e inicio de sesión de clientes
├── admin/
│   ├── login.html        → inicio de sesión del panel
│   └── dashboard.html    → panel: velas, mensajes y opiniones
├── assets/
│   ├── css/
│   │   ├── styles.css    → estilos e identidad visual
│   │   └── admin.css     → estilos del panel
│   └── js/
│       ├── config.js     → ÚNICO lugar para configurar URL de la API y WhatsApp
│       ├── api.js        → capa que habla con el backend (o modo demo)
│       ├── main.js       → navegación y botón flotante de WhatsApp
│       ├── contacto.js   → validación y envío del formulario
│       ├── ai-assistant.js → widget del chatbot
│       ├── admin-login.js  → login del panel
│       └── admin-dashboard.js → lógica del panel
└── backend/
    ├── server.js         → arranque del servidor, CORS y errores
    ├── package.json      → dependencias
    ├── .env.example      → plantilla de variables (sin secretos)
    ├── routes/           → una ruta por tema (products, contact, auth, ai, reviews)
    ├── middleware/       → verificación del token del admin
    ├── utils/db.js       → conexión a la base de datos
    └── data/             → (solo local) archivo db.json, no se sube a GitHub
```

---

## 🔌 API (backend)

Dirección base: `https://nagomi-candles-api.onrender.com/api`

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| GET | `/health` | público | Comprueba que el servidor está encendido |
| GET | `/products?scent=lavanda` | público | Lista las velas (filtro opcional por aroma) |
| GET | `/products/:id` | público | Detalle de una vela |
| POST | `/products` | 🔒 admin | Crea una vela |
| PUT | `/products/:id` | 🔒 admin | Edita una vela |
| DELETE | `/products/:id` | 🔒 admin | Elimina una vela |
| POST | `/contact` | público | Envía un mensaje de contacto |
| GET | `/contact` | 🔒 admin | Lista los mensajes |
| PATCH | `/contact/:id/read` | 🔒 admin | Marca un mensaje como leído |
| POST | `/auth/login` | público | Login del admin → devuelve un token JWT |
| POST | `/auth/register` | público | Crea una cuenta de cliente |
| POST | `/auth/customer-login` | público | Login de cliente |
| POST | `/reviews` | público | Envía una opinión (queda pendiente) |
| GET | `/reviews/admin` | 🔒 admin | Lista todas las opiniones |
| PATCH | `/reviews/:id/approve` | 🔒 admin | Aprueba u oculta una opinión |
| POST | `/ai/recommend` | público | Recomienda velas según un estado de ánimo |
| POST | `/ai/ask` | público | Chatbot: responde cualquier pregunta sobre la tienda |

Las rutas 🔒 necesitan el encabezado `Authorization: Bearer <token>`.

---

## 🤖 La IA personalizada

El chatbot (`backend/routes/ai.js`) funciona en dos niveles:

1. **IA generativa (Gemini).** Cada pregunta se envía a Gemini junto con un
   "prompt de sistema" que le explica quién es Nagomi Candles, su tono de
   marca (cálido, tranquilo, con metáforas de mar), las políticas de la
   tienda y **el catálogo real leído de la base de datos**. Por eso, si la
   administradora agrega una vela nueva o cambia un precio, el chatbot ya lo
   sabe sin tocar código. También tiene reglas para no inventar productos ni
   precios.
2. **Motor de reglas (respaldo).** Si no hay llave de Gemini, se acaba la
   cuota gratuita o Gemini falla, el chatbot responde con reglas escritas a
   mano (detecta estados de ánimo, nombres de velas y preguntas frecuentes).
   Así nunca se queda sin responder.

Además, el endpoint del chat tiene un **límite de 15 preguntas por minuto**
por visitante, para proteger la cuota gratuita.

---

## 🔐 Decisiones de seguridad

- **Contraseñas cifradas** con bcrypt: nunca se guardan en texto.
- **Sesiones con JWT**: el panel solo funciona con un token válido; el token
  se guarda en `sessionStorage` (se borra al cerrar el navegador).
- **Usuario y contraseña del admin** salen de variables de entorno, no del
  código. Si se cambian en Render, la nueva contraseña se aplica al reiniciar.
- **CORS restringido**: la API solo acepta peticiones de la página publicada
  (y de Live Server en desarrollo), no de cualquier sitio.
- **Secretos fuera de GitHub**: `.env`, `node_modules` y `data/db.json` están
  en `.gitignore`. Solo se sube `.env.example`, sin valores.
- **Textos escapados** en el panel para que un mensaje con código no se
  ejecute.

---

## 💻 Cómo correrlo en tu computadora

Necesitas [Node.js](https://nodejs.org) (versión 18.11 o mayor) y
[Visual Studio Code](https://code.visualstudio.com) con la extensión
**Live Server**.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Abre `backend/.env` y completa:

| Variable | Obligatoria | Ejemplo / descripción |
|---|---|---|
| `JWT_SECRET` | ✅ | Clave larga al azar. Genérala con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_USER` | ✅ | Usuario del panel, por ejemplo `admin` |
| `ADMIN_PASSWORD` | ✅ | Contraseña del panel (mínimo 12 caracteres) |
| `MONGODB_URI` | opcional | Conexión a MongoDB Atlas. Si la dejas vacía, los datos se guardan en `backend/data/db.json` |
| `GEMINI_API_KEY` | opcional | Llave de Google AI Studio. Sin ella, el chat usa el motor de reglas |
| `CORS_ORIGIN` | en producción | Origen de la página publicada, por ejemplo `https://arianna-star289.github.io` |
| `NODE_ENV` | en producción | `production` |

Después:

```bash
npm start
```

Debe aparecer `Nagomi Candles backend corriendo en http://localhost:4000`.

> En Windows, si PowerShell bloquea `npm`, usa `npm.cmd install` y
> `npm.cmd start`.

### 2. Frontend

1. En `assets/js/config.js`, pon `API_BASE_URL: "http://localhost:4000/api"`.
2. Haz clic derecho en `index.html` → **Open with Live Server**.

> Abre la página con Live Server, no con doble clic: con doble clic el
> navegador bloquea la conexión con el backend.

---

## 🚀 Cómo está publicado

**Frontend – GitHub Pages**
Settings → Pages → rama `main`, carpeta `/ (root)`.

**Backend – Render (Web Service, plan Free)**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Variables de entorno: las mismas de la tabla de arriba.

**Base de datos – MongoDB Atlas (cluster gratuito M0)**
- Network Access: `0.0.0.0/0` (porque la dirección de Render cambia).
- La conexión se pega en la variable `MONGODB_URI` de Render.

**Conectar las partes:** en `assets/js/config.js`, `API_BASE_URL` apunta a
`https://nagomi-candles-api.onrender.com/api`.

---

## ⚙️ Configuración del negocio

Todo lo que cambia según la tienda está en `assets/js/config.js`:

```js
window.NAGOMI_CONFIG = {
  API_BASE_URL: "https://nagomi-candles-api.onrender.com/api",
  CONTACT_EMAIL: "ariannajibajaramirez@gmail.com",
  WHATSAPP_NUMBER: "593XXXXXXXXX" // código de país + número, sin el 0 inicial
};
```

---

## 📬 Contacto

¿Dudas sobre un aroma o quieres hacer un pedido?
Escríbenos a **ariannajibajaramirez@gmail.com** o a **@nagomicandles** 🌊
