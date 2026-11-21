/**
 * reviews-public.js
 * -----------------------------------------------------------------------
 * Muestra en la página de inicio las opiniones que la administradora
 * aprobó en el panel. Las que están pendientes u ocultas no aparecen.
 * Las opiniones nuevas se envían desde Contacto.
 * -----------------------------------------------------------------------
 */
(function () {
  const box = document.getElementById("publicReviews");
  if (!box) return;

  const MAX = 6; // mostramos las 6 más recientes

  // Estilos de las tarjetas (se agregan una sola vez).
  const css = document.createElement("style");
  css.textContent = `
    .reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:24px;text-align:left}
    .review-card{background:#fff;border:1px solid #eee2f4;border-radius:20px;padding:20px;box-shadow:0 10px 28px #44305a10}
    .review-stars{color:#e0a43a;font-size:1.05rem;letter-spacing:2px}
    .review-text{margin:10px 0 14px;line-height:1.55}
    .review-name{font-weight:800}
    .review-date{font-size:.85rem;color:#6f6479}
    .reviews-empty{margin-top:16px;color:#6f6479}`;
  document.head.appendChild(css);

  // Crea un elemento con texto seguro (nunca interpreta HTML del cliente).
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" });
  }

  function showEmpty() {
    box.innerHTML = "";
    const p = el("p", "reviews-empty", "Todavía no hay opiniones publicadas. ");
    const link = el("a", "", "¡Sé la primera persona en dejar la tuya!");
    link.href = "contacto.html#reviewTitle";
    p.appendChild(link);
    box.appendChild(p);
  }

  box.innerHTML = '<div class="state-box"><div class="spinner"></div>Cargando opiniones…</div>';

  NagomiAPI.getPublicReviews()
    .then((reviews) => {
      if (!Array.isArray(reviews) || !reviews.length) return showEmpty();
      box.innerHTML = "";
      const grid = el("div", "reviews-grid");
      reviews.slice(0, MAX).forEach((r) => {
        const card = el("article", "review-card");
        const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
        const stars = el("div", "review-stars", "★".repeat(rating) + "☆".repeat(5 - rating));
        stars.setAttribute("aria-label", `${rating} de 5 estrellas`);
        card.appendChild(stars);
        card.appendChild(el("p", "review-text", `“${r.comment}”`));
        card.appendChild(el("div", "review-name", r.name));
        card.appendChild(el("div", "review-date", formatDate(r.createdAt)));
        grid.appendChild(card);
      });
      box.appendChild(grid);
    })
    .catch(showEmpty); // si falla, no rompemos la página
})();
