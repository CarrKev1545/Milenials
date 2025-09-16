// Animación de entrada, validación mínima y toggle de contraseña con SVG inline.

document.addEventListener("DOMContentLoaded", () => {
  const card      = document.querySelector(".login-card");
  const form      = document.querySelector("form.login-form");
  const userInput = document.getElementById("usuario") || document.getElementById("username");
  const passInput = document.getElementById("password");
  const submitBtn = document.querySelector(".btn-login");
  const toggleBtn = document.querySelector(".toggle-pass");

  if (!card || !form || !userInput || !passInput || !submitBtn) return;

  // 1) Animación de entrada
  card.classList.add("enter");

  // 2) Toggle mostrar/ocultar contraseña (SVG, sin CDNs)
  if (toggleBtn) {
    const icons = {
      eye: `<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5c5 0 9 3.5 11 7-2 3.5-6 7-11 7S3 15.5 1 12c2-3.5 6-7 11-7Zm0 2C8.5 7 5.7 9.2 4.1 12 5.7 14.8 8.5 17 12 17s6.3-2.2 7.9-5C18.3 9.2 15.5 7 12 7Zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5Z"/>
            </svg>`,
      eyeOff: `<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true">
                 <path d="M2 3.3 3.3 2 22 20.7 20.7 22l-3.2-3.2C15.7 19.6 13.9 20 12 20 7 20 3 16.5 1 13c.9-1.6 2.3-3.3 4.1-4.7L2 3.3Zm8.2 4 1.6 1.6a2.5 2.5 0 0 1 3.2 3.2l1.6 1.6A5 5 0 0 0 10.2 7.3ZM12 7c3.5 0 6.3 2.2 7.9 5-.7 1.2-1.7 2.4-2.9 3.3l-1.5-1.5a6 6 0 0 0-7.3-7.3L7.7 5.2C9 4.8 10.5 4.6 12 5Z"/>
               </svg>`
    };

    const setIcon = (visible) => {
      toggleBtn.innerHTML = visible ? icons.eyeOff : icons.eye;
      toggleBtn.classList.toggle("on", visible);
      toggleBtn.setAttribute("aria-pressed", String(visible));
      toggleBtn.dataset.visible = String(visible);
    };

    // estado inicial: oculto
    setIcon(false);

    toggleBtn.addEventListener("click", () => {
      const visible = passInput.type === "text" ? false : true;
      passInput.type = visible ? "text" : "password";
      setIcon(visible);

      // mantiene el foco y el cursor al final
      passInput.focus({ preventScroll: true });
      const v = passInput.value;
      passInput.value = "";
      passInput.value = v;
    });
  }

  // 3) Validación mínima en cliente
  form.addEventListener("submit", (e) => {
    let ok = true;

    // Reset de errores
    [userInput, passInput].forEach(inp => {
      inp.classList.remove("input-error");
      inp.setAttribute("aria-invalid", "false");
    });

    if (!userInput.value.trim()) { markError(userInput); ok = false; }
    if (!passInput.value.trim()) { markError(passInput); ok = false; }

    if (!ok) {
      e.preventDefault();
      card.classList.remove("shake");
      void card.offsetWidth; // reflow para reiniciar la animación
      card.classList.add("shake");
      (!userInput.value.trim() ? userInput : passInput).focus();
      return;
    }

    // Estado "Ingresando…"
    submitBtn.disabled = true;
    submitBtn.dataset.prev = submitBtn.textContent;
    submitBtn.textContent = "Ingresando…";
  });

  // Quitar error al tipear
  [userInput, passInput].forEach(inp => {
    inp.addEventListener("input", () => {
      if (inp.value.trim()) {
        inp.classList.remove("input-error");
        inp.setAttribute("aria-invalid", "false");
      }
    });
  });

  function markError(el) {
    el.classList.add("input-error");
    el.setAttribute("aria-invalid", "true");
  }
});
