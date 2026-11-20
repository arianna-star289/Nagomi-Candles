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

  // Acceso visible a la cuenta del cliente.
  const nav = document.querySelector(".main-nav");
  if (nav && !nav.querySelector('a[href="cuenta.html"]')) {
    const accountLink = document.createElement("a");
    accountLink.href = path === "admin" ? "../cuenta.html" : "cuenta.html";
    accountLink.textContent = "Mi cuenta";
    nav.appendChild(accountLink);
  }

  // Botón de WhatsApp: se activa al configurar el número del negocio.
  const phone = (window.NAGOMI_CONFIG && window.NAGOMI_CONFIG.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (phone) {
    const wa = document.createElement("a");
    wa.href = `https://wa.me/${phone}?text=${encodeURIComponent("Hola, quiero información sobre las velas de Nagomi Candles.")}`;
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    wa.className = "nagomi-whatsapp";
    wa.textContent = "WhatsApp · Haz tu pedido";
    wa.setAttribute("aria-label", "Contactar a Nagomi Candles por WhatsApp");
    document.body.appendChild(wa);
  }
})();
