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
├── contacto.html     → el formulario de contacto
├── admin/            → el panel privado (inicio de sesión y gestión)
├── assets/           → los colores, estilos y la parte que hace funcionar la página
└── backend/          → la parte "de atrás": el servidor y la información de la tienda
```

Separé la parte que se ve (lo que abre la persona en su navegador) de la
parte de atrás (donde se guarda la información), para que cada cosa tenga
su lugar y sea fácil encontrarla.

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
