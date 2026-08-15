# 🕯️ Nagomi Candles

Velas aromáticas artesanales inspiradas en el anime y el océano.
*"Respira el mar, enciende la calma."*

Sitio web estático con catálogo de velas filtrable por aroma (lavanda, vainilla,
cítrico, océano, floral, té verde), carrito de compras y un control de
presupuesto en tiempo real (barra tipo "marea" que sube según lo que gastas).

## Estructura del proyecto

```
nagomi-candles/
├── index.html   → estructura de la página
├── style.css    → estilos (paleta pastel, tipografía, animaciones)
├── script.js    → catálogo de velas, filtros, carrito y presupuesto
└── README.md    → este archivo
```

No necesita build ni dependencias: es HTML/CSS/JS puro. El carrito y el
presupuesto se guardan en `localStorage`, así que se mantienen aunque
recargues la página.

## Cómo verlo en tu computadora

Simplemente abre `index.html` con doble clic, o usa un servidor local:

```bash
cd nagomi-candles
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Subirlo a GitHub

1. Crea un repositorio nuevo en GitHub (por ejemplo `nagomi-candles`), sin
   README ni .gitignore (ya los tienes aquí o los puedes omitir).
2. En tu computadora, dentro de la carpeta `nagomi-candles`, ejecuta:

   ```bash
   git init
   git add .
   git commit -m "Primer commit: Nagomi Candles"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/nagomi-candles.git
   git push -u origin main
   ```

   (Reemplaza `TU-USUARIO` por tu usuario de GitHub y `nagomi-candles` por el
   nombre real de tu repositorio.)

3. Opcional — publícalo gratis con **GitHub Pages**:
   - Ve a tu repo → `Settings` → `Pages`.
   - En "Source" elige la rama `main` y la carpeta `/root`.
   - Guarda: en un par de minutos tendrás una URL pública tipo
     `https://TU-USUARIO.github.io/nagomi-candles/`.

## Abrirlo en Trae AI

1. Abre Trae AI y elige **"Open Folder"** (o "Clonar repositorio" si prefieres
   traerlo directo desde GitHub, pegando la URL del repo que creaste arriba).
2. Selecciona la carpeta `nagomi-candles`.
3. Trae detectará `index.html`, `style.css` y `script.js` como un proyecto
   web normal — puedes pedirle a su asistente que edite colores, textos,
   agregue más velas al arreglo `CANDLES` en `script.js`, etc.
4. Para verla en vivo mientras editas, usa la vista previa integrada de Trae
   o un servidor local (ver arriba).

## Personalizarla rápido

- **Agregar una vela nueva:** copia un objeto dentro del arreglo `CANDLES` en
  `script.js` y cambia `id`, `name`, `scent`, `scentLabel`, `desc`, `price`,
  `wax` y `jar`.
- **Cambiar los colores del sitio:** todos los colores están centralizados
  como variables al inicio de `style.css`, dentro de `:root`.
- **Cambiar el presupuesto por defecto:** el usuario lo escribe en el
  carrito; no hay un valor fijo en el código.
