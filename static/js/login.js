// UX del login: animación de entrada, shake en error, toggle de contraseña
// y estado "Ingresando…" sin bloquear el POST real cuando todo está OK.

document.addEventListener("DOMContentLoaded", () => {
  const card      = document.querySelector(".login-card");
  const form      = document.querySelector("form.login-form");
  const userInput = document.getElementById("usuario")  || document.getElementById("username");
  const passInput = document.getElementById("password");
  const submitBtn = document.querySelector(".btn-login");
  const toggleBtn = document.querySelector(".toggle-pass");

  if (!card || !form || !userInput || !passInput || !submitBtn) return;

  // 1) Animación de entrada
  card.classList.add("enter");

  // 2) Toggle mostrar/ocultar contraseña (FontAwesome)
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const icon = toggleBtn.querySelector("i");
      const isPassword = passInput.type === "password";
      passInput.type = isPassword ? "text" : "password";
      toggleBtn.classList.toggle("on", isPassword);
      if (icon) {
        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
      }
      passInput.focus({ preventScroll: true });

      // Mover cursor al final
      const val = passInput.value;
      passInput.value = "";
      passInput.value = val;
    });
  }

  // 3) Validación mínima en cliente
  form.addEventListener("submit", (e) => {
    let ok = true;

    [userInput, passInput].forEach(inp => {
      inp.classList.remove("input-error");
      inp.setAttribute("aria-invalid", "false");
    });

    if (!userInput.value.trim()) { markError(userInput); ok = false; }
    if (!passInput.value.trim()) { markError(passInput); ok = false; }

    if (!ok) {
      e.preventDefault();
      card.classList.remove("shake");
      void card.offsetWidth; // reflow para reiniciar anim
      card.classList.add("shake");
      (!userInput.value.trim() ? userInput : passInput).focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.dataset.prev = submitBtn.textContent;
    submitBtn.textContent = "Ingresando…";
  });

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
