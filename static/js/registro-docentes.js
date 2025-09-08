// ============================
// Registro Docentes – Menú móvil + UX
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const toggle  = document.getElementById('menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navbar  = document.querySelector('.navbar');
  let backdrop  = document.querySelector('.nav-backdrop');

  if (!toggle || !navMenu || !navbar) return;

  // Asegura backdrop si no existiera
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  // Accesibilidad
  if (!navMenu.id) navMenu.id = 'primary-menu';
  toggle.setAttribute('aria-controls', navMenu.id);
  toggle.setAttribute('aria-expanded', 'false');

  // Helpers scroll lock
  const lockScroll   = () => { document.documentElement.style.overflow = 'hidden'; };
  const unlockScroll = () => { document.documentElement.style.overflow = ''; };

  const openMenu = () => {
    navbar.classList.add('is-open');
    navMenu.classList.add('active');
    backdrop.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
    lockScroll();
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClickOutside, { capture: true });
  };

  const closeMenu = () => {
    navbar.classList.remove('is-open');
    navMenu.classList.remove('active');
    backdrop.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    unlockScroll();
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClickOutside, { capture: true });
  };

  const isOpen = () => navbar.classList.contains('is-open');

  const onKeydown = (e) => { if (e.key === 'Escape') { closeMenu(); toggle.focus(); } };
  const onClickOutside = (e) => {
    if (!navMenu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  };

  toggle.addEventListener('click', (e) => { e.stopPropagation(); isOpen() ? closeMenu() : openMenu(); });
  backdrop.addEventListener('click', closeMenu);
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Cierra al pasar a escritorio
  const mq = window.matchMedia('(min-width: 1001px)');
  const handleChange = () => { if (mq.matches) closeMenu(); };
  if (mq.addEventListener) mq.addEventListener('change', handleChange);
  else mq.addListener(handleChange);

  // ============================
  // Toggle mostrar/ocultar contraseña
  // ============================
  document.querySelectorAll('.js-toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('.js-pass');
      if (!input) return;
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.innerHTML = isPwd
        ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
    });
  });

  // Footer dinámico (año)
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
