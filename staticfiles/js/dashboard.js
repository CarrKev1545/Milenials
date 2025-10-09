// ============================
// Dashboard – Navbar responsive + Accesibilidad + UX
// ============================
document.addEventListener('DOMContentLoaded', () => {
  // Soportar ambas convenciones de ID para el botón:
  const toggle  = document.getElementById('menu-toggle') || document.getElementById('menuToggle');
  // Soportar nav por id o por clase:
  const navMenu = document.getElementById('navMenu') || document.querySelector('.nav-menu');
  const navbar  = document.getElementById('navbar')  || document.querySelector('.navbar');

  if (!toggle || !navMenu || !navbar) return;

  // Reusar backdrop si existe; crear si no.
  let backdrop = document.getElementById('navBackdrop') || document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.id = 'navBackdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);
  }

  // Evitar scroll al abrir menú móvil
  const lockScroll   = () => { document.documentElement.style.overflow = 'hidden'; };
  const unlockScroll = () => { document.documentElement.style.overflow = ''; };

  // ARIA
  if (!navMenu.id) navMenu.id = 'primary-menu';
  toggle.setAttribute('aria-controls', navMenu.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', toggle.getAttribute('aria-label') || 'Abrir menú');

  // Utilidades de foco
  const getFocusable = (root) => {
    return Array.from(root.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null || window.getComputedStyle(el).position === 'fixed');
  };

  const focusFirstLink = () => {
    const f = navMenu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
    if (f) f.focus({ preventScroll: true });
    else navMenu.focus({ preventScroll: true });
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeMenu();
      toggle.focus();
      return;
    }
    // Focus trap cuando está abierto y en móvil
    if (navbar.classList.contains('is-open') && window.matchMedia('(max-width: 1000px)').matches) {
      if (e.key === 'Tab') {
        const focusables = getFocusable(navMenu);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  const onClickOutside = (e) => {
    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  };

  const openMenu = () => {
    navbar.classList.add('is-open');
    navMenu.classList.add('active');
    backdrop.classList.add('is-visible');
    backdrop.hidden = false; // para compatibilidad si se usó hidden
    toggle.setAttribute('aria-expanded', 'true');
    lockScroll();

    // listeners
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClickOutside, { capture: true });

    // Enfoca primer link
    setTimeout(focusFirstLink, 0);
  };

  const closeMenu = () => {
    navbar.classList.remove('is-open');
    navMenu.classList.remove('active');
    backdrop.classList.remove('is-visible');
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    unlockScroll();

    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClickOutside, { capture: true });
  };

  const isOpen = () => navbar.classList.contains('is-open');
  const toggleMenu = () => (isOpen() ? closeMenu() : openMenu());

  // Abrir/cerrar con el botón
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Cerrar con clic en backdrop
  backdrop.addEventListener('click', closeMenu);

  // Cerrar al hacer clic en cualquier link del menú
  navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Cerrar si pasamos a escritorio
  const mq = window.matchMedia('(min-width: 1001px)');
  const handleChange = () => { if (mq.matches) closeMenu(); };
  if (mq.addEventListener) mq.addEventListener('change', handleChange);
  else mq.addListener(handleChange); // Safari viejo

  // ============================
  // Cards - Redirección con click
  // ============================
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const link = card.getAttribute('data-link');
      if (link) window.location.href = link;
    });
  });

  // Footer dinámico (año)
  const copyright = document.querySelector('.copyright');
  if (copyright) {
    const year = new Date().getFullYear();
    // Si ya hay texto, respétalo; si no, pon el por defecto
    if (!copyright.textContent.trim()) {
      copyright.textContent = `© ${year} Colegio XYZ. Todos los derechos reservados.`;
    } else {
      // opcional: reemplazar solo el año si detectas un patrón
    }
  }
});

// ============================
// Mostrar / Ocultar Contraseñas (si se usa en alguna vista)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const toggleButtons = document.querySelectorAll(".field-action");

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling; // El input que está antes del botón
      const icon = btn.querySelector("i");

      if (input && input.type === "password") {
        input.type = "text";
        if (icon) { icon.classList.remove("fa-eye"); icon.classList.add("fa-eye-slash"); }
      } else if (input) {
        input.type = "password";
        if (icon) { icon.classList.remove("fa-eye-slash"); icon.classList.add("fa-eye"); }
      }
    });
  });
});
