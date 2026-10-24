/**
 * admin-dashboard.js
 * -----------------------------------------------------------------------
 * Panel privado protegido por sesión (token en localStorage). Permite:
 *   - Ver / crear / editar / eliminar velas del catálogo (CRUD completo)
 *   - Ver los mensajes que llegan por el formulario de contacto real
 * Usa NagomiAPI para todo, así que funciona igual con backend real o en
 * modo demo (localStorage).
 * -----------------------------------------------------------------------
 */
(function () {
  const SESSION_KEY = "nagomi_admin_session";
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

  // Ruta protegida: sin sesión, no hay panel.
  if (!session || !session.token) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("adminUserLabel").textContent = `Hola, ${session.username}`;
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  });

  async function flagDemo() {
    await NagomiAPI.checkBackend();
    if (NagomiAPI.isDemoMode()) {
      document.querySelectorAll("[data-demo-badge]").forEach((el) => (el.style.display = "inline-block"));
    }
  }
  flagDemo();

  // ---------- tabs ----------
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("is-active");
      if (tab.dataset.tab === "mensajes") loadMessages();
    });
  });

  // ---------- CATALOGO ----------
  const productForm = document.getElementById("productForm");
  const productsState = document.getElementById("productsState");
  const tableWrap = document.getElementById("productsTableWrap");
  const tableBody = document.getElementById("productsTableBody");
  const productStatus = document.getElementById("productStatus");

  document.getElementById("newProductBtn").addEventListener("click", () => openForm());
  document.getElementById("cancelProductBtn").addEventListener("click", () => closeForm());

  function openForm(product) {
    productForm.style.display = "block";
    productStatus.textContent = "";
    document.getElementById("productId").value = product ? product.id : "";
    document.getElementById("pName").value = product ? product.name : "";
    document.getElementById("pScent").value = product ? product.scent : "lavanda";
    document.getElementById("pPrice").value = product ? product.price : "";
    document.getElementById("pStock").value = product ? product.stock : "";
    document.getElementById("pDesc").value = product ? product.desc : "";
  }
  function closeForm() {
    productForm.style.display = "none";
    productForm.reset();
  }

  async function loadProducts() {
    productsState.innerHTML = `<div class="state-box"><div class="spinner"></div>Cargando catálogo…</div>`;
    tableWrap.style.display = "none";
    try {
      const products = await NagomiAPI.getProducts("todos");
      productsState.innerHTML = "";
      tableWrap.style.display = "block";
      tableBody.innerHTML = products.map((p) => `
        <tr>
          <td><span class="swatch" style="background:${p.wax}"></span></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.scentLabel || p.scent}</td>
          <td>$${p.price}</td>
          <td>${p.stock ?? "—"}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" data-edit="${p.id}" title="Editar">✎</button>
              <button class="icon-btn danger" data-delete="${p.id}" title="Eliminar">🗑</button>
            </div>
          </td>
        </tr>
      `).join("");

      tableBody.querySelectorAll("[data-edit]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const product = products.find((p) => p.id === btn.dataset.edit);
          openForm(product);
        });
      });
      tableBody.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("¿Eliminar esta vela del catálogo?")) return;
          try {
            await NagomiAPI.deleteProduct(btn.dataset.delete, session.token);
            loadProducts();
          } catch (err) {
            alert(err.message || "No se pudo eliminar.");
          }
        });
      });
    } catch (err) {
      productsState.innerHTML = `<div class="state-box">No pudimos cargar el catálogo. ${err.message || ""}</div>`;
    }
  }

  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("productId").value;
    const payload = {
      name: document.getElementById("pName").value.trim(),
      scent: document.getElementById("pScent").value,
      scentLabel: document.getElementById("pScent").selectedOptions[0].textContent,
      price: document.getElementById("pPrice").value,
      stock: document.getElementById("pStock").value,
      desc: document.getElementById("pDesc").value.trim()
    };

    if (!payload.name || !payload.price) {
      productStatus.textContent = "Nombre y precio son obligatorios.";
      productStatus.className = "form-status is-error";
      return;
    }

    try {
      if (id) {
        await NagomiAPI.updateProduct(id, payload, session.token);
      } else {
        await NagomiAPI.createProduct(payload, session.token);
      }
      closeForm();
      loadProducts();
    } catch (err) {
      productStatus.textContent = err.message || "No se pudo guardar la vela.";
      productStatus.className = "form-status is-error";
    }
  });

  // ---------- MENSAJES ----------
  const messagesState = document.getElementById("messagesState");
  const messagesList = document.getElementById("messagesList");
  let messagesLoaded = false;

  async function loadMessages() {
    if (messagesLoaded) return;
    messagesState.innerHTML = `<div class="state-box"><div class="spinner"></div>Cargando mensajes…</div>`;
    try {
      const messages = await NagomiAPI.getMessages(session.token);
      messagesLoaded = true;
      messagesState.innerHTML = "";
      if (messages.length === 0) {
        messagesState.innerHTML = `<div class="state-box">Todavía no han llegado mensajes de contacto.</div>`;
        return;
      }
      messagesList.innerHTML = messages.map((m) => `
        <article class="msg-card ${m.read ? "" : "is-unread"}" data-id="${m.id}">
          <div class="msg-card-head">
            <strong>${m.name}</strong>
            <time>${new Date(m.createdAt).toLocaleString("es-ES")}</time>
          </div>
          <p><a href="mailto:${m.email}">${m.email}</a></p>
          <p>${m.message}</p>
          ${m.read ? "" : `<button class="btn btn-ghost btn-sm" data-mark-read="${m.id}">Marcar como leído</button>`}
        </article>
      `).join("");

      messagesList.querySelectorAll("[data-mark-read]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          await NagomiAPI.markMessageRead(btn.dataset.markRead, session.token);
          messagesLoaded = false;
          loadMessages();
        });
      });
    } catch (err) {
      messagesState.innerHTML = `<div class="state-box">No pudimos cargar los mensajes. ${err.message || ""}</div>`;
    }
  }

  loadProducts();
})();
