/**
 * admin-login.js
 * -----------------------------------------------------------------------
 
 * -----------------------------------------------------------------------
 */
(function () {
  const SESSION_KEY = "nagomi_admin_session";

  // si ya hay sesión activa, saltar directo al dashboard
  if (localStorage.getItem(SESSION_KEY)) {
    window.location.href = "dashboard.html";
  }

  const form = document.getElementById("loginForm");
  const status = document.getElementById("loginStatus");
  const btn = document.getElementById("loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      status.textContent = "Escribe usuario y contraseña.";
      status.className = "form-status is-error";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Entrando...";
    status.textContent = "";
    status.className = "form-status";

    try {
      const session = await NagomiAPI.login(username, password);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      window.location.href = "dashboard.html";
    } catch (err) {
      status.textContent = err.message || "No pudimos iniciar sesión.";
      status.className = "form-status is-error";
      btn.disabled = false;
      btn.textContent = "Iniciar sesión";
    }
  });
})();
