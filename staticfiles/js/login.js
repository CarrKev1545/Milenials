// static/js/login.js
// UX del login: animación de entrada, shake en error, botón mostrar/ocultar,
// y estado "Ingresando…" sin bloquear el POST real cuando todo está OK.

document.addEventListener("DOMContentLoaded", () => {
  const card      = document.querySelector(".login-card");
  const form      = document.querySelector("form.login-form");
  // Soporta ambos ids por si cambian en el futuro
  const userInput = document.getElementById("usuario")  || document.getElementById("username");
  const passInput = document.getElementById("password");
  const submitBtn = document.querySelector(".btn-login");

  if (!card || !form || !userInput || !passInput || !submitBtn) return;

  // 1) Animación de entrada
  card.classList.add("enter");

  // 2) Botón mostrar/ocultar contraseña (sin tocar el HTML)
  (function addTogglePassword() {
    // Envolver el input en .field-wrap
    if (!passInput.parentElement.classList.contains("field-wrap")) {
      const wrap = document.createElement("span");
      wrap.className = "field-wrap";
      passInput.parentNode.insertBefore(wrap, passInput);
      wrap.appendChild(passInput);

      // Botón 👁️
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toggle-pass";
      toggle.setAttribute("aria-label", "Mostrar u ocultar contraseña");
      toggle.setAttribute("aria-pressed", "false");
      toggle.innerHTML = "👁️";
      wrap.appendChild(toggle);

      toggle.addEventListener("click", () => {
        const showing = passInput.type === "text";
        passInput.type = showing ? "password" : "text";
        toggle.setAttribute("aria-pressed", String(!showing));
        toggle.classList.toggle("on", !showing);
        passInput.focus();

        // Mover cursor al final
        const val = passInput.value;
        passInput.value = "";
        passInput.value = val;
      });
    }
  })();

  // 3) Validación mínima en cliente
  form.addEventListener("submit", (e) => {
    let ok = true;

    // Reset de errores
    [userInput, passInput].forEach(inp => {
      inp.classList.remove("input-error");
      inp.setAttribute("aria-invalid", "false");
    });

    if (!userInput.value.trim()) {
      markError(userInput);
      ok = false;
    }
    if (!passInput.value.trim()) {
      markError(passInput);
      ok = false;
    }

    if (!ok) {
      // Bloquea el submit solo si hay error
      e.preventDefault();

      // Shake del card
      card.classList.remove("shake");
      // Forzar reflow para reiniciar la animación
      void card.offsetWidth;
      card.classList.add("shake");

      // Foco en el primer campo vacío
      (!userInput.value.trim() ? userInput : passInput).focus();
      return;
    }

    // Si todo ok, dejamos que el form haga POST normal a Django,
    // pero mostramos estado "Ingresando…"
    submitBtn.disabled = true;
    submitBtn.dataset.prev = submitBtn.textContent;
    submitBtn.textContent = "Ingresando…";
  });

  // Quitar marca de error al escribir
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