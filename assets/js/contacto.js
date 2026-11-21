/**
 * contacto.js
 * -----------------------------------------------------------------------
 * Formulario de contacto real: valida en el cliente, muestra estado de
 * carga mientras envía, y usa NagomiAPI.sendMessage() (backend real o
 * modo demo). Si venimos desde el catálogo con ?vela=NombreDeLaVela,
 * precargamos el mensaje.
 * -----------------------------------------------------------------------
 */
(function () {
  const form = document.getElementById("contactForm");
  const nameInput = document.getElementById("inputName");
  const emailInput = document.getElementById("inputEmail");
  const messageInput = document.getElementById("inputMessage");
  const submitBtn = document.getElementById("submitBtn");
  const status = document.getElementById("formStatus");

  const params = new URLSearchParams(window.location.search);
  const candleName = params.get("vela");
  if (candleName) {
    messageInput.value = `Hola, me interesa la vela "${candleName}". Quisiera saber más antes de comprarla.`;
  }

  // ---------- Botón de WhatsApp ----------
  // Si la tienda configuró su número en config.js, mostramos un botón que
  // abre WhatsApp con el nombre y el mensaje que la persona escribió.
  const whatsappBtn = document.getElementById("whatsappBtn");
  const waNumber = ((window.NAGOMI_CONFIG && window.NAGOMI_CONFIG.WHATSAPP_NUMBER) || "").replace(/\D/g, "");
  if (whatsappBtn && waNumber) {
    whatsappBtn.style.display = "block";
    whatsappBtn.addEventListener("click", (e) => {
      const name = nameInput.value.trim();
      const text = messageInput.value.trim();
      if (!text) {
        e.preventDefault();
        setFieldError("fieldMessage", true);
        status.textContent = "Escribe tu mensaje antes de enviarlo por WhatsApp.";
        status.className = "form-status is-error";
        return;
      }
      const full = (name ? `Hola, soy ${name}. ` : "") + text;
      whatsappBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(full)}`;
    });
  }

  // ---------- Botón de Gmail y enlace de correo ----------
  // Abren el correo del cliente con el destinatario, el asunto y el
  // mensaje ya escritos; el cliente solo presiona "Enviar" y el correo
  // llega a la bandeja de la tienda (CONTACT_EMAIL en config.js).
  const storeEmail = (window.NAGOMI_CONFIG && window.NAGOMI_CONFIG.CONTACT_EMAIL) || "";
  const gmailBtn = document.getElementById("gmailBtn");
  const mailtoLink = document.getElementById("mailtoLink");

  function buildEmail() {
    const name = nameInput.value.trim();
    const text = messageInput.value.trim();
    const subject = name ? `Consulta de ${name} - Nagomi Candles` : "Consulta - Nagomi Candles";
    const body = (name ? `Hola, soy ${name}.\n\n` : "Hola,\n\n") + text;
    return { subject, body, text };
  }

  // Si falta el mensaje, avisamos en vez de abrir un correo vacío.
  function requireMessage(e) {
    if (messageInput.value.trim()) return true;
    e.preventDefault();
    setFieldError("fieldMessage", true);
    status.textContent = "Escribe tu mensaje antes de enviarlo por correo.";
    status.className = "form-status is-error";
    return false;
  }

  if (!storeEmail) {
    if (gmailBtn) gmailBtn.style.display = "none";
    if (mailtoLink) mailtoLink.parentElement.style.display = "none";
  }

  // En el celular, el enlace web de Gmail abre la bandeja de entrada y
  // pierde el mensaje; ahí usamos "mailto:", que abre la app de correo del
  // teléfono con todo ya escrito. En computadora seguimos usando Gmail web.
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

  if (gmailBtn && storeEmail) {
    if (isMobile) {
      gmailBtn.removeAttribute("target");
      gmailBtn.textContent = "✉️ Enviar por correo";
    }
    gmailBtn.addEventListener("click", (e) => {
      if (!requireMessage(e)) return;
      const { subject, body } = buildEmail();
      gmailBtn.href = isMobile
        ? `mailto:${storeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        // Enlace oficial de Gmail para "redactar" un correo nuevo.
        : "https://mail.google.com/mail/?view=cm&fs=1" +
          `&to=${encodeURIComponent(storeEmail)}` +
          `&su=${encodeURIComponent(subject)}` +
          `&body=${encodeURIComponent(body)}`;
    });
  }

  if (mailtoLink && storeEmail) {
    mailtoLink.addEventListener("click", (e) => {
      if (!requireMessage(e)) return;
      const { subject, body } = buildEmail();
      mailtoLink.href = `mailto:${storeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  function setFieldError(fieldId, hasError) {
    document.getElementById(fieldId).classList.toggle("has-error", hasError);
  }

  function validate() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameOk = nameInput.value.trim().length > 1;
    const emailOk = emailRegex.test(emailInput.value.trim());
    const messageOk = messageInput.value.trim().length > 3;

    setFieldError("fieldName", !nameOk);
    setFieldError("fieldEmail", !emailOk);
    setFieldError("fieldMessage", !messageOk);

    return nameOk && emailOk && messageOk;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    if (!validate()) {
      status.textContent = "Revisa los campos marcados en rojo.";
      status.classList.add("is-error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      await NagomiAPI.sendMessage({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim()
      });
      status.textContent = "¡Mensaje enviado! Te responderemos pronto a tu correo. 🌊";
      status.classList.add("is-success");
      form.reset();
    } catch (err) {
      status.textContent = err.message || "No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos directo por correo.";
      status.classList.add("is-error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar mensaje";
    }
  });

  const reviewForm = document.getElementById("reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const reviewStatus = document.getElementById("reviewStatus");
      const reviewSubmit = document.getElementById("reviewSubmit");
      reviewStatus.textContent = "Enviando comentario…";
      reviewSubmit.disabled = true;
      try {
        const result = await NagomiAPI.sendReview({
          name: document.getElementById("reviewName").value.trim(),
          rating: Number(document.getElementById("reviewRating").value),
          comment: document.getElementById("reviewComment").value.trim()
        });
        reviewStatus.textContent = result.message || "¡Gracias por compartir tu opinión!";
        reviewStatus.className = "form-status is-success";
        reviewForm.reset();
      } catch (err) {
        reviewStatus.textContent = err.message || "No se pudo enviar el comentario.";
        reviewStatus.className = "form-status is-error";
      } finally {
        reviewSubmit.disabled = false;
      }
    });
  }
})();
