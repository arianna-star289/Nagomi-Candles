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
})();
