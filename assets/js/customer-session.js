/**
 * customer-session.js
 * -----------------------------------------------------------------------
 * Muestra que el cliente inició sesión, en todas las páginas públicas:
 *   - En el menú, "Mi cuenta" cambia a "Hola, <nombre> 👋".
 *   - En Mi cuenta, en lugar del formulario se ve su sesión y un botón
 *     para cerrar sesión.
 *   - En Contacto, su nombre y correo aparecen escritos solos.
 *
 * La sesión la guarda cuenta.html en localStorage al iniciar sesión o
 * registrarse (clave "nagomi_customer_session").
 * -----------------------------------------------------------------------
 */
const NagomiCustomer = (function () {
  const KEY = "nagomi_customer_session";

  // Lee el token JWT para saber si ya venció (campo "exp", en segundos).
  function isExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.exp && payload.exp * 1000 < Date.now();
    } catch (e) {
      return false; // si no se puede leer, no lo damos por vencido
    }
  }

  // Devuelve { name, email } o null si no hay sesión válida.
  function get() {
    let raw;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    if (!raw) return null;

    // El backend puede devolver los datos sueltos o dentro de "user"/"customer".
    const info = raw.user || raw.customer || raw;
    const email = info.email || raw.email || "";
    const name = info.name || raw.name || (email ? email.split("@")[0] : "");
    if (!name && !email) return null;

    if (raw.token && isExpired(raw.token)) {
      logout(false);
      return null;
    }
    return { name, email, token: raw.token || "" };
  }

  function logout(reload = true) {
    try { localStorage.removeItem(KEY); } catch (e) { /* nada */ }
    if (reload) window.location.reload();
  }

  function firstName(name) {
    return String(name).trim().split(/\s+/)[0];
  }

  // ---------- menú ----------
  function renderNav(user) {
    document.querySelectorAll('.main-nav a[href="cuenta.html"]').forEach((link) => {
      link.textContent = user ? `Hola, ${firstName(user.name)} 👋` : "Mi cuenta";
      link.title = user ? "Ver mi cuenta" : "";
    });
  }

  // ---------- página Mi cuenta ----------
  function renderAccountPage(user) {
    const card = document.querySelector(".account-card");
    if (!card) return;

    let panel = document.getElementById("customerPanel");
    const pieces = card.querySelectorAll(".account-tabs, #accountForm");

    if (!user) {
      if (panel) panel.remove();
      pieces.forEach((el) => (el.style.display = ""));
      return;
    }

    pieces.forEach((el) => (el.style.display = "none"));
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "customerPanel";
      card.appendChild(panel);
    }

    // Usamos textContent para el nombre y el correo (evita inyectar HTML).
    panel.innerHTML = `
      <p class="account-note" style="margin-top:6px">Sesión iniciada como</p>
      <p style="font-size:1.25rem;font-weight:800;margin:4px 0" data-name></p>
      <p class="account-note" data-email style="margin-bottom:8px"></p>
      <p class="account-note" style="margin-bottom:20px">♡ Tus velas favoritas se guardan en tu cuenta: las verás desde cualquier celular o computadora.</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <a class="btn btn-primary" href="catalogo.html" style="flex:1 1 180px;text-align:center">Ver el catálogo</a>
        <button type="button" class="btn btn-ghost" data-logout style="flex:1 1 180px">Cerrar sesión</button>
      </div>`;
    panel.querySelector("[data-name]").textContent = `Hola, ${user.name} 🌊`;
    panel.querySelector("[data-email]").textContent = user.email;
    panel.querySelector("[data-logout]").addEventListener("click", () => logout(true));
  }

  // ---------- página Contacto: autocompletar ----------
  function prefillForms(user) {
    if (!user) return;
    const fill = (id, value) => {
      const el = document.getElementById(id);
      if (el && !el.value && value) el.value = value;
    };
    fill("inputName", user.name);
    fill("inputEmail", user.email);
    fill("reviewName", user.name);
  }

  function render() {
    const user = get();
    renderNav(user);
    renderAccountPage(user);
    prefillForms(user);
  }

  document.addEventListener("DOMContentLoaded", render);
  if (document.readyState !== "loading") render();

  return { get, logout, render };
})();
