/**
 * admin-dashboard.js
 * -----------------------------------------------------------------------
 * Panel privado de Nagomi Candles. Tres pestañas:
 *   - Catálogo: crear, editar y eliminar velas
 *   - Mensajes de contacto: leer y marcar como leídos
 *   - Opiniones: aprobar u ocultar opiniones de clientes
 *
 * Toda la comunicación con el servidor pasa por NagomiAPI (api.js) y
 * cada petición protegida lleva el token JWT del login.
 * Si el token vence o es inválido (error 401), cerramos la sesión.
 * -----------------------------------------------------------------------
 */
(function () {
  const SESSION_KEY = "nagomi_admin_session";

  // ---------- sesión ----------
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { session = null; }
  if (!session || !session.token) {
    window.location.href = "login.html";
    return;
  }
  const token = session.token;

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* nada */ }
    window.location.href = "login.html";
  }

  // Si el servidor dice que la sesión no es válida, volvemos al login.
  function handleAuthError(err) {
    const msg = (err && err.message ? err.message : "").toLowerCase();
    if (msg.includes("token") || msg.includes("sesión") || msg.includes("autoriz") || msg.includes("401")) {
      alertLater("Tu sesión expiró. Vuelve a iniciar sesión.");
      setTimeout(logout, 1500);
      return true;
    }
    return false;
  }
  function alertLater(text) { console.warn(text); }

  document.getElementById("adminUserLabel").textContent = "Hola, " + (session.username || "admin");
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Escapa texto antes de meterlo en HTML (evita que un mensaje con
  // etiquetas <script> se ejecute dentro del panel).
  function esc(value) {
    const div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function stateBox(el, text, loading) {
    el.innerHTML = '<div class="state-box">' + (loading ? '<div class="spinner"></div>' : "") + esc(text) + "</div>";
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" });
  }

  // ---------- pestañas ----------
  const loaded = {};
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.toggle("is-active", t === tab));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("is-active"));
      document.getElementById("panel-" + tab.dataset.tab).classList.add("is-active");
      // Cargamos cada pestaña solo la primera vez que se abre.
      if (!loaded[tab.dataset.tab]) {
        loaded[tab.dataset.tab] = true;
        if (tab.dataset.tab === "mensajes") loadMessages();
        if (tab.dataset.tab === "opiniones") loadReviews();
      }
    });
  });

  // =====================================================================
  // CATÁLOGO
  // =====================================================================
  const form = document.getElementById("productForm");
  const fId = document.getElementById("productId");
  const fName = document.getElementById("pName");
  const fScent = document.getElementById("pScent");
  const fPrice = document.getElementById("pPrice");
  const fStock = document.getElementById("pStock");
  const fDesc = document.getElementById("pDesc");
  const productStatus = document.getElementById("productStatus");
  const productsState = document.getElementById("productsState");
  const tableWrap = document.getElementById("productsTableWrap");
  const tbody = document.getElementById("productsTableBody");
  const saveBtn = form.querySelector('button[type="submit"]');

  let products = [];

  function setProductStatus(text, type) {
    productStatus.textContent = text;
    productStatus.className = "form-status" + (type ? " is-" + type : "");
  }

  function openForm(product) {
    form.style.display = "block";
    setProductStatus("");
    fId.value = product ? product.id : "";
    fName.value = product ? product.name : "";
    fScent.value = product ? product.scent : "lavanda";
    fPrice.value = product ? product.price : "";
    fStock.value = product ? (product.stock ?? 0) : "";
    fDesc.value = product ? (product.desc || "") : "";
    saveBtn.textContent = product ? "Guardar cambios" : "Crear vela";
    fName.focus();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeForm() {
    form.reset();
    fId.value = "";
    form.style.display = "none";
  }

  document.getElementById("newProductBtn").addEventListener("click", () => openForm(null));
  document.getElementById("cancelProductBtn").addEventListener("click", closeForm);

  async function loadProducts() {
    stateBox(productsState, "Cargando velas…", true);
    tableWrap.style.display = "none";
    try {
      products = await NagomiAPI.getProducts("todos");
      if (NagomiAPI.isDemoMode()) {
        document.querySelectorAll("[data-demo-badge]").forEach((b) => (b.style.display = "inline-block"));
      }
      renderProducts();
    } catch (err) {
      stateBox(productsState, "No se pudo cargar el catálogo. " + (err.message || ""));
    }
  }

  function renderProducts() {
    if (!products.length) {
      stateBox(productsState, "Todavía no hay velas. Crea la primera con “+ Nueva vela”.");
      tableWrap.style.display = "none";
      return;
    }
    productsState.innerHTML = "";
    tableWrap.style.display = "block";
    tbody.innerHTML = products.map((p) => `
      <tr>
        <td><span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${esc(p.wax || "#DCCBF3")};border:1px solid rgba(0,0,0,.08)"></span></td>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${esc(p.scentLabel || p.scent)}</td>
        <td>$${esc(p.price)}</td>
        <td>${esc(p.stock ?? 0)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-ghost btn-sm" data-edit="${esc(p.id)}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-delete="${esc(p.id)}">Eliminar</button>
        </td>
      </tr>`).join("");
  }

  // Un solo listener para todos los botones de la tabla (delegación de eventos).
  tbody.addEventListener("click", async (e) => {
    const editId = e.target.getAttribute("data-edit");
    const deleteId = e.target.getAttribute("data-delete");

    if (editId) {
      openForm(products.find((p) => p.id === editId));
    }

    if (deleteId) {
      const product = products.find((p) => p.id === deleteId);
      if (!confirm(`¿Eliminar la vela "${product ? product.name : deleteId}"? Esta acción no se puede deshacer.`)) return;
      e.target.disabled = true;
      e.target.textContent = "Eliminando…";
      try {
        await NagomiAPI.deleteProduct(deleteId, token);
        products = products.filter((p) => p.id !== deleteId);
        renderProducts();
      } catch (err) {
        if (!handleAuthError(err)) alert(err.message || "No se pudo eliminar la vela.");
        e.target.disabled = false;
        e.target.textContent = "Eliminar";
      }
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // evita que la página se recargue y se pierdan los cambios

    const name = fName.value.trim();
    const price = Number(fPrice.value);
    const stock = Number(fStock.value || 0);

    // Validaciones antes de enviar al servidor
    if (name.length < 2) return setProductStatus("Escribe un nombre para la vela.", "error");
    if (!fPrice.value || isNaN(price) || price <= 0) return setProductStatus("Escribe un precio mayor a 0.", "error");
    if (isNaN(stock) || stock < 0) return setProductStatus("El inventario no puede ser negativo.", "error");

    const payload = {
      name,
      scent: fScent.value,
      scentLabel: fScent.options[fScent.selectedIndex].text,
      price,
      stock,
      desc: fDesc.value.trim()
    };

    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Guardando…";
    setProductStatus("");

    try {
      if (fId.value) {
        const updated = await NagomiAPI.updateProduct(fId.value, payload, token);
        products = products.map((p) => (p.id === fId.value ? updated : p));
        setProductStatus("¡Cambios guardados! 🕯️", "success");
      } else {
        const created = await NagomiAPI.createProduct(payload, token);
        products.push(created);
        setProductStatus("¡Vela creada! 🕯️", "success");
      }
      renderProducts();
      setTimeout(closeForm, 900);
    } catch (err) {
      if (!handleAuthError(err)) setProductStatus(err.message || "No se pudo guardar la vela.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });

  // =====================================================================
  // MENSAJES DE CONTACTO
  // =====================================================================
  const messagesState = document.getElementById("messagesState");
  const messagesList = document.getElementById("messagesList");

  async function loadMessages() {
    stateBox(messagesState, "Cargando mensajes…", true);
    messagesList.innerHTML = "";
    try {
      const messages = await NagomiAPI.getMessages(token);
      if (!messages.length) return stateBox(messagesState, "Aún no hay mensajes. Cuando alguien escriba desde Contacto, aparecerá aquí 🌊");
      messagesState.innerHTML = "";
      messagesList.innerHTML = messages.map((m) => `
        <article class="form-card" style="max-width:none;margin-bottom:14px;${m.read ? "opacity:.7" : ""}">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <strong>${esc(m.name)} · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a></strong>
            <small>${esc(formatDate(m.createdAt))}</small>
          </div>
          <p style="margin:10px 0;white-space:pre-wrap">${esc(m.message)}</p>
          ${m.read
            ? '<small>✓ Leído</small>'
            : `<button class="btn btn-ghost btn-sm" data-read="${esc(m.id)}">Marcar como leído</button>`}
        </article>`).join("");
    } catch (err) {
      if (!handleAuthError(err)) stateBox(messagesState, "No se pudieron cargar los mensajes. " + (err.message || ""));
    }
  }

  messagesList.addEventListener("click", async (e) => {
    const id = e.target.getAttribute("data-read");
    if (!id) return;
    e.target.disabled = true;
    try {
      await NagomiAPI.markMessageRead(id, token);
      loadMessages();
    } catch (err) {
      if (!handleAuthError(err)) alert(err.message || "No se pudo marcar el mensaje.");
      e.target.disabled = false;
    }
  });

  // =====================================================================
  // OPINIONES
  // =====================================================================
  const reviewsState = document.getElementById("reviewsState");
  const reviewsList = document.getElementById("reviewsList");

  async function loadReviews() {
    stateBox(reviewsState, "Cargando opiniones…", true);
    reviewsList.innerHTML = "";
    try {
      const reviews = await NagomiAPI.getReviews(token);
      if (!reviews.length) return stateBox(reviewsState, "Aún no hay opiniones de clientes.");
      reviewsState.innerHTML = "";
      reviewsList.innerHTML = reviews.map((r) => `
        <article class="form-card" style="max-width:none;margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <strong>${esc(r.name)} · ${"★".repeat(Number(r.rating) || 0)}</strong>
            <small>${esc(formatDate(r.createdAt))} · ${r.approved ? "✓ Publicada" : "Pendiente"}</small>
          </div>
          <p style="margin:10px 0;white-space:pre-wrap">${esc(r.comment)}</p>
          <button class="btn btn-ghost btn-sm" data-review="${esc(r.id)}" data-approve="${r.approved ? "false" : "true"}">
            ${r.approved ? "Ocultar" : "Aprobar"}
          </button>
        </article>`).join("");
    } catch (err) {
      if (!handleAuthError(err)) stateBox(reviewsState, "No se pudieron cargar las opiniones. " + (err.message || ""));
    }
  }

  reviewsList.addEventListener("click", async (e) => {
    const id = e.target.getAttribute("data-review");
    if (!id) return;
    e.target.disabled = true;
    try {
      await NagomiAPI.approveReview(id, e.target.getAttribute("data-approve") === "true", token);
      loadReviews();
    } catch (err) {
      if (!handleAuthError(err)) alert(err.message || "No se pudo actualizar la opinión.");
      e.target.disabled = false;
    }
  });

  // Al abrir el panel, cargamos el catálogo (pestaña activa por defecto).
  loaded.catalogo = true;
  loadProducts();
})();
