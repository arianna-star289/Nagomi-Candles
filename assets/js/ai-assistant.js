/**
 * ai-assistant.js
 * -----------------------------------------------------------------------
 * Widget flotante de IA presente en todas las páginas públicas. Habla
 * con NagomiAPI.aiAsk() y NagomiAPI.aiRecommend(), que internamente usan
 * el backend real o el motor de reglas local en modo demo.
 * -----------------------------------------------------------------------
 */
(function () {
  const toggle = document.getElementById("aiToggle");
  const panel = document.getElementById("aiPanel");
  const body = document.getElementById("aiBody");
  const form = document.getElementById("aiForm");
  const input = document.getElementById("aiInput");
  const quick = document.getElementById("aiQuick");

  if (!toggle || !panel) return; // widget no incluido en esta página

  function addMessage(text, from) {
    const div = document.createElement("div");
    div.className = `ai-msg ${from}`;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function open() {
    panel.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    input.focus();
  }
  function close() {
    panel.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", () => {
    panel.classList.contains("is-open") ? close() : open();
  });

  const MOODS = [
    { key: "relajarme", label: "Relajarme" },
    { key: "dormir", label: "Dormir" },
    { key: "energizarme", label: "Energizarme" },
    { key: "concentrarme", label: "Concentrarme" },
    { key: "celebrar", label: "Celebrar" },
    { key: "viajar", label: "Viajar con la mente" }
  ];

  if (quick) {
    quick.innerHTML = MOODS.map((m) => `<button type="button" data-mood="${m.key}">${m.label}</button>`).join("");
    quick.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-mood]");
      if (!btn) return;
      addMessage(`Quiero ${btn.textContent.toLowerCase()}`, "user");
      try {
        const res = await NagomiAPI.aiRecommend(btn.dataset.mood, "suave");
        let text = res.message + "\n\n";
        text += res.recommendations.map((c) => `• ${c.name} — $${c.price}`).join("\n");
        addMessage(text, "bot");
      } catch (err) {
        addMessage(err.message || "No pude generar una recomendación ahora mismo.", "bot");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (!question) return;
      addMessage(question, "user");
      input.value = "";
      try {
        const res = await NagomiAPI.aiAsk(question);
        addMessage(res.answer, "bot");
      } catch (err) {
        addMessage("Tuve un problema respondiendo. Intenta de nuevo en un momento.", "bot");
      }
    });
  }

  // mensaje de bienvenida
  addMessage("¡Hola! Soy el asistente de Nagomi Candles 🌊 Cuéntame cómo te quieres sentir, o pregúntame sobre envíos, precios o ingredientes.", "bot");
})();
