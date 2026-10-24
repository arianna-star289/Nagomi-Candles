/**
 * main.js
 * -----------------------------------------------------------------------
 * Lógica compartida por todas las páginas públicas: marca el link activo
 * del menú y muestra un aviso discreto si la app está en modo demo
 * (sin backend real conectado).
 * -----------------------------------------------------------------------
 */
(function () {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[data-page]").forEach((link) => {
    if (link.dataset.page === path) link.classList.add("is-active");
  });

  async function flagDemoMode() {
    await NagomiAPI.checkBackend();
    if (NagomiAPI.isDemoMode()) {
      document.querySelectorAll("[data-demo-badge]").forEach((el) => {
        el.style.display = "inline-block";
      });
    }
  }
  flagDemoMode();
})();
