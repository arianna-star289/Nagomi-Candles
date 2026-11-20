# 🕯️ Nagomi Candles

*Respira el mar, enciende la calma.*

Nagomi Candles es una tienda en línea de velas aromáticas hechas a mano,
inspiradas en dos cosas que me encantan: el anime y el mar.

El nombre viene de una palabra japonesa, **nagomi** (和み), que describe esa
sensación de paz suave que sientes cuando el mar está tranquilo o cuando
termina un episodio que te dejó el corazón en calma. Quise que cada vela
se sintiera así.

Este es mi proyecto final de la Ruta Avanzada de Jóvenes Creativos.

---

## ¿Qué se puede hacer en la página?

- **Conocer la marca** en la página de inicio.
- **Ver el catálogo** de velas y filtrarlas por aroma: lavanda, vainilla,
  cítrico, océano, floral y té verde.
- **Guardar favoritas**: cada vela tiene un corazón ♡ para marcarla, y hay
  un botón para ver solo las que guardaste.
- **Escribirnos** desde el formulario de contacto. Los mensajes le llegan a
  quien administra la tienda.
- **Preguntarle al asistente** (el botón 🌊 de la esquina). Te recomienda una
  vela según cómo te quieras sentir (relajarte, dormir, concentrarte...) y
  responde dudas sobre envíos, precios o ingredientes.
- **Administrar la tienda** desde un panel privado con usuario y contraseña:
  agregar, cambiar o quitar velas, y leer los mensajes recibidos.

---

## ¿Cómo está organizado el proyecto?

```
nagomi-candles/
├── index.html        → la página de inicio
├── catalogo.html     → el catálogo de velas
├── contacto.html     → el formulario de contacto y las opiniones
├── cuenta.html       → registro e inicio de sesión de clientes
├── admin/            → el panel privado (inicio de sesión y gestión)
├── assets/           → los colores, estilos y la parte que hace funcionar la página
└── backend/          → la parte "de atrás": el servidor y la información de la tienda
```

Separé la parte que se ve (lo que abre la persona en su navegador) de la
parte de atrás (donde se guarda la información), para que cada cosa tenga
su lugar y sea fácil encontrarla.

---

## Cómo verla en tu computadora

Lo más fácil: descarga el proyecto, descomprímelo y abre el archivo
`index.html` con doble clic. Se abre en tu navegador y listo.

Si no tienes el servidor encendido, la página funciona igual en
**modo demostración**: guarda la información dentro de tu mismo navegador.
Verás un avisito que lo dice. Así la página nunca se queda vacía ni rota.

### Entrar al panel privado

Entra por el botón **Panel admin** del menú. El usuario y la contraseña
se configuran en el archivo `backend/.env` (`ADMIN_USER` y `ADMIN_PASSWORD`),
que nunca se sube a GitHub.

---

## Si quieres encender el servidor (opcional)

Necesitas tener [Node.js](https://nodejs.org) instalado. Luego, desde la
carpeta del proyecto:

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Con eso el servidor queda encendido en tu computadora y la página lo usa
sola. Los mensajes y los cambios del catálogo se guardan de verdad, aunque
cierres el navegador.

Para dejarlo encendido en internet, se puede subir la carpeta `backend` a
un servicio gratuito como [Render](https://render.com). Después hay que
cambiar una sola línea en el archivo `assets/js/config.js` y poner la
dirección que Render te dé.

---

## Cómo la publiqué

La subí a GitHub y la activé con GitHub Pages:

1. Creé un repositorio llamado `Nagomi-Candles`.
2. Subí los archivos poco a poco, guardando cada avance con su propio mensaje.
3. En **Settings → Pages** elegí la rama `main` y la carpeta raíz.
4. En un par de minutos la página quedó disponible en internet.

---

## Herramientas que usé

HTML, CSS y JavaScript para armar la página, React para el catálogo,
y Node.js para la parte del servidor.

---

## Contacto

¿Dudas sobre un aroma o quieres hacer un pedido?
Escríbenos a **ariannajibajaramirez@gmail.com** 🌊


## Actualización: cuentas, opiniones y pedidos

- `cuenta.html` contiene el registro y el inicio de sesión de clientes.
- El backend incorpora `POST /api/auth/register` y `POST /api/auth/customer-login`.
- `POST /api/reviews` recibe opiniones; quedan pendientes hasta que el administrador las apruebe.
- El panel de administración incorpora una pestaña para moderar opiniones.
- El catálogo prepara mensajes de pedido para WhatsApp cuando se configure el número comercial.
- El acceso de administrador ya no usa credenciales de demostración en el frontend.

### Configuración obligatoria antes de publicar el backend

1. En `backend`, crea un archivo `.env` a partir de `.env.example`.
2. Configura un `JWT_SECRET` aleatorio y largo, `ADMIN_USER` privado y `ADMIN_PASSWORD` único de al menos 12 caracteres.
3. Configura `CORS_ORIGIN` con el origen exacto de GitHub Pages.
4. Configura el número comercial en `assets/js/config.js`, en `WHATSAPP_NUMBER`, con código de país y solo dígitos (Ecuador: 593 seguido del número, sin el 0 inicial).
5. Despliega el backend en un servicio compatible con Node.js y cambia `API_BASE_URL` en `assets/js/config.js` a la URL HTTPS real del backend, terminada en `/api`.

**Importante:** GitHub Pages solo publica archivos estáticos. El registro, login, mensajes, opiniones y administración no estarán disponibles para todos los visitantes hasta desplegar el backend y conectar `API_BASE_URL`. No publiques archivos `.env`, contraseñas ni claves secretas en GitHub.
