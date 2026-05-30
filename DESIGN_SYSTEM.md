# Sistema de Diseño - Millennials

Este documento describe el sistema de diseño del proyecto Millennials, incluyendo colores, tipografía, espaciado, componentes y breakpoints responsivos.

## Tabla de Contenidos

1. [Colores](#colores)
2. [Tipografía](#tipografía)
3. [Espaciado](#espaciado)
4. [Layout](#layout)
5. [Componentes](#componentes)
6. [Breakpoints Responsivos](#breakpoints-responsivos)
7. [Accesibilidad](#accesibilidad)

---

## Colores

### Paleta Principal (Dashboard)

```css
--accent: #9c0f10;          /* Rojo institucional */
--accent-dark: #b02020;     /* Rojo más claro (WCAG AA) */
--white: #ffffff;           /* Blanco */
--muted: #cfcfcf;           /* Gris claro para texto secundario */
--bg-overlay: rgba(0,0,0,.78);     /* Overlay oscuro */
--pill-bg: rgba(24,24,24,.88);     /* Fondo de pills */
--footer-bg: #000000;       /* Fondo del footer */
```

### Colores de Tarjetas y Tablas

```css
--card-bg: rgba(16,16,18,.86);      /* Fondo de tarjetas */
--card-border: rgba(255,255,255,.08); /* Borde de tarjetas */
--card-shadow: 0 22px 44px rgba(0,0,0,.45); /* Sombra de tarjetas */
--head-green: #0f7a2a;       /* Verde para encabezados */
--head-green-dk: #0b5c20;    /* Verde oscuro */
--row-bg: rgba(255,255,255,.90);  /* Fondo de filas */
--row-alt: rgba(255,255,255,.98);  /* Fondo alternativo */
--row-border: rgba(0,0,0,.08);     /* Borde de filas */
--text-strong: #101113;      /* Texto fuerte */
```

### Paleta Responsive (Global)

```css
--brand: #9c0f10;           /* Marca principal */
--brand-600: #800000;       /* Marca oscura */
--bg: #0e0e10;              /* Fondo principal */
--surface: #17171a;         /* Superficie */
--text: #e7e7ea;            /* Texto principal */
--muted: #b5b5bd;           /* Texto secundario */
--ok: #16a34a;              /* Éxito/Verde */
--warn: #f59e0b;            /* Advertencia/Amarillo */
--err: #ef4444;             /* Error/Rojo */
```

### Contraste WCAG

- Texto blanco sobre fondo negro: 21:1 (WCAG AAA)
- Texto muted sobre fondo negro: 12.6:1 (WCAG AAA)
- Texto blanco sobre rojo (#9c0f10): 4.6:1 (WCAG AA)
- Texto blanco sobre rojo oscuro (#b02020): 5.3:1 (WCAG AA)

---

## Tipografía

### Fuentes

```css
font-family: "Segoe UI", Roboto, Arial, sans-serif;
/* Fallback: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell */
```

### Escala Fluida (Responsive)

```css
--fs-xs: clamp(.75rem, .72rem + .25vw, .875rem);   /* 12px - 14px */
--fs-sm: clamp(.875rem, .82rem + .35vw, .975rem);  /* 14px - 15.6px */
--fs-md: clamp(1rem, .9rem + .6vw, 1.125rem);      /* 16px - 18px */
--fs-lg: clamp(1.125rem, 1rem + .9vw, 1.375rem);   /* 18px - 22px */
--fs-xl: clamp(1.35rem, 1.1rem + 1.5vw, 1.9rem);    /* 21.6px - 30.4px */
--fs-2xl: clamp(1.75rem, 1.35rem + 2.4vw, 2.65rem); /* 28px - 42.4px */
```

### Escala Base Rem (Login/Boletín)

```css
:root { font-size: 16px; }
@media (max-width: 75em) { :root { font-size: 15px; } }  /* ~1200px */
@media (max-width: 62em) { :root { font-size: 14px; } }  /* ~992px */
@media (max-width: 48em) { :root { font-size: 13px; } }  /* ~768px */
@media (max-width: 36em) { :root { font-size: 12px; } }  /* ~576px */
```

---

## Espaciado

### Grid de 4px

```css
--s-1: .25rem;  /* 4px */
--s-2: .5rem;   /* 8px */
--s-3: .75rem;  /* 12px */
--s-4: 1rem;    /* 16px */
--s-5: 1.25rem; /* 20px */
--s-6: 1.5rem;  /* 24px */
--s-8: 2rem;    /* 32px */
```

### Border Radius

```css
--radius: 1.25rem;           /* 20px - general */
--card-radius: 28px;         /* Tarjetas grandes */
```

---

## Layout

### Dimensiones

```css
--navbar-height: 76px;      /* Altura de navbar */
--admin-bar-height: 56px;    /* Franja roja administrativa */
--footer-height: 86px;       /* Altura del footer (desktop) */
--footer-height: 120px;      /* Altura del footer (móvil) */
--container: 1200px;         /* Ancho máximo del contenedor */
```

### Z-Index (Capas)

```css
--z-backdrop: 900;          /* Backdrop del menú móvil */
--z-navbar: 1000;           /* Navbar */
--z-panel: 1100;            /* Paneles modales */
--z-footer: 45;             /* Footer */
```

### Scroll Padding

```css
scroll-padding-top: calc(var(--navbar-height) + 52px);
```

---

## Componentes

### Navbar

- **Desktop**: Menú horizontal con pills centrados
- **Móvil**: Menú hamburguesa con panel lateral
- **Altura**: 76px (desktop), 80px (móvil)
- **Background**: Gradiente oscuro con backdrop-filter

### Cards

- **Border Radius**: 28px
- **Background**: rgba(16,16,18,.86)
- **Shadow**: 0 22px 44px rgba(0,0,0,.45)
- **Hover**: translateY(-6px) scale(1.01)
- **Focus**: outline 3px solid rgba(179,0,0,0.12)

### Botones

#### Botón Principal (Danger)
```css
background: var(--accent);
color: var(--white);
border-radius: 12px;
height: 48-50px;
box-shadow: 0 12px 22px rgba(156,15,16,.38);
```

#### Botón Ghost
```css
background: transparent;
color: var(--white);
border: 1px solid rgba(255,255,255,.1);
```

### Footer

- **Desktop**: position: fixed en el fondo
- **Móvil**: position: static (scroll normal)
- **Background**: Gradiente oscuro
- **Padding**: 40px extra en desktop para evitar que tape contenido

### Formularios

- **Border Radius**: 12px
- **Focus**: outline 2px solid var(--accent)
- **Background**: rgba(255,255,255,.05)
- **Border**: 1px solid rgba(255,255,255,.1)

---

## Breakpoints Responsivos

### Breakpoints Principales

```css
/* Desktop grande */
@media (min-width: 1300px) { }

/* Desktop estándar */
@media (min-width: 993px) { }

/* Tablet */
@media (max-width: 992px) { }

/* Móvil grande */
@media (max-width: 768px) { }

/* Móvil mediano */
@media (max-width: 560px) { }

/* Móvil pequeño */
@media (max-width: 480px) { }

/* Móvil muy pequeño */
@media (max-width: 420px) { }
```

### Comportamiento por Breakpoint

#### Desktop (min-width: 993px)
- Navbar: Menú horizontal visible
- Footer: position: fixed
- Cards: Grid con múltiples columnas
- Formularios: Layout de 2 columnas

#### Tablet (max-width: 992px)
- Navbar: Menú hamburguesa
- Footer: position: static
- Cards: Grid reducido
- Formularios: Layout de 1 columna

#### Móvil (max-width: 768px)
- Navbar: Panel lateral
- Footer: position: static
- Cards: 1-2 columnas
- Tablas: Stack vertical

#### Móvil Pequeño (max-width: 420px)
- Footer: position: static (siempre)
- Cards: 1 columna
- Texto: Tamaños reducidos

---

## Accesibilidad

### Focus Visible

```css
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### Hover None

```css
@media (hover: none) {
  .card:hover {
    transform: none;
  }
}
```

### ARIA Labels

- Navbar: `role="navigation" aria-label="Barra principal"`
- Footer: `role="contentinfo" aria-label="Pie de página del sitio"`
- Menú móvil: `aria-controls="navMenu" aria-expanded="false"`
- Botones: `aria-label` descriptivo

---

## Iconos

### Font Awesome

- **Versión**: 6.5.0
- **CDN**: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css
- **Carga**: Preload asincrónico con fallback

### Iconos Usados

- fa-bars (menú hamburguesa)
- fa-user-pen (registro notas)
- fa-user-graduate (estudiantes)
- fa-people-arrows (estudiantes a grupos)
- fa-chalkboard-user (asignación docentes)
- fa-eraser (limpiar)
- fa-floppy-disk (guardar)
- fa-people-group (grupos)
- fa-building-columns (sede)
- fa-calendar-alt (periodo)
- fa-chevron-down (dropdown)
- fa-sitemap (grado)
- fa-people-roof (grupo)
- fa-id-card (identificación)
- fa-calendar-days (calendario)
- fa-user-plus (agregar usuario)
- fa-eye, fa-eye-slash (mostrar/ocultar contraseña)

---

## Optimizaciones de Rendimiento

### Lazy Loading

- Imágenes del footer: `loading="lazy"`
- Imágenes críticas (navbar, login): Sin lazy loading

### Preload

- CSS crítico: `rel="preload" as="style"`
- Font Awesome: `rel="preload" as="style" onload="this.rel='stylesheet'"`
- Fallback para JavaScript deshabilitado: `<noscript>`

### Compresión

- Django ManifestStaticFilesStorage para producción
- Cache busting automático

---

## Convenciones de Código

### Nomenclatura CSS

- BEM modificado para componentes
- Variables CSS con prefijo `--`
- Prefijos de vendor automáticos

### Estructura de Archivos

```
static/css/
├── dashboard.css      # Estilos del dashboard
├── responsive.css     # Estilos responsivos globales
├── login.css          # Estilos de login
└── boletin/boletin.css # Estilos de boletines

static/js/
├── dashboard.js       # JavaScript del dashboard
└── login.js           # JavaScript de login
```

---

## Notas de Mantenimiento

### Actualización de Colores

- Modificar variables CSS en `:root`
- Verificar contraste WCAG AA (4.5:1 mínimo)
- Probar en tema claro y oscuro

### Actualización de Breakpoints

- Modificar media queries en archivos CSS
- Probar en múltiples dispositivos
- Verificar comportamiento de footer fijo

### Agregar Nuevos Componentes

- Seguir convención de nomenclatura
- Incluir estados hover/focus/active
- Agregar ARIA labels apropiados
- Probar accesibilidad con teclado

---

## Recursos Externos

- [Font Awesome](https://fontawesome.com/)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)

---

**Última actualización**: Mayo 30, 2026
**Versión**: 1.0
