/**
 * admin-login.js
 * -----------------------------------------------------------------------
 * Inicio de sesión del panel de administración.
 * Envía usuario y contraseña al backend (NagomiAPI.login). Si son
 * correctos, el backend devuelve un token JWT que guardamos en
 * sessionStorage (se borra al cerrar el navegador, más seguro que
 * localStorage) y pasamos al panel.
 * -----------------------------------------------------------------------
 */
(function () {
  const SESSION_KEY = "nagomi_admin_session";

  // Si ya hay sesión activa, vamos directo al panel.
  try {
    if (sessionStorage.getItem(SESSION_KEY)) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (e) { /* sessionStorage no disponible: seguimos con el login */ }

  const form = document.getElementById("loginForm");
  const userInput = document.getElementById("username");
  const passInput = document.getElementById("password");
  const btn = document.getElementById("loginBtn");
  const status = document.getElementById("loginStatus");

  function showStatus(text, type) {
    status.textContent = text;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = userInput.value.trim();
    const password = passInput.value;

    if (!username || !password) {
      showStatus("Escribe tu usuario y contraseña.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Entrando…";
    showStatus("");

    try {
      const res = await NagomiAPI.login(username, password);
      const token = res.token || res.accessToken;
      if (!token) throw new Error("El servidor no devolvió una sesión válida.");

      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        token,
        username: res.username || (res.user && res.user.username) || username
      }));
      showStatus("¡Bienvenida! Abriendo el panel…", "success");
      window.location.href = "dashboard.html";
    } catch (err) {
      showStatus(err.message || "No se pudo iniciar sesión.", "error");
      btn.disabled = false;
      btn.textContent = "Iniciar sesión";
    }
  });
})();
