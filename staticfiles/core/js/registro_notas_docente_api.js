/* static/core/js/registro_notas_docente_api.js
   ----------------------------------------------------------------------
   Rol: DOCENTE
   Proposito: Registrar/actualizar notas contra el endpoint del docente
   Endpoint:  /docente/notas/registrar
   API pública: guardarNota(...)
   ----------------------------------------------------------------------
   Reutiliza la misma firma usada en el rol Rector para no romper plantillas:

   Forma 1 (compatibilidad directa):
      guardarNota(estudianteId, asignaturaId, periodoId, inputNotaEl, inputFallasEl, botonEl?)

   Forma 2 (flexible por objeto):
      guardarNota({
        estudiante_id, asignatura_id, periodo_id,
        nota, fallas = 0,
        row, btn
      })

   También incluye un auto-enlazado opcional: cualquier botón con
   [data-guardar-nota] dentro de una fila con [data-row-estudiante="ID"]
   buscará .inp-nota y .inp-fallas en esa fila y llamará a guardarNota().
   ---------------------------------------------------------------------- */

(() => {
  "use strict";

  // ====== CONFIG ======
  const REGISTRAR_NOTA_URL = window.location.origin + "/docente/notas/registrar";

  // ====== UTILIDADES ======
  function getCookie(name) {
    // Obtiene csrftoken desde cookies (Django)
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    return null;
  }

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function parseNota(valor) {
    if (valor == null) return null;
    const v = String(valor).replace(",", ".").trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    // Redondeo a 2 decimales
    return Math.round(n * 100) / 100;
  }

  function parseFallas(valor) {
    if (valor == null || String(valor).trim() === "") return 0;
    const n = Number(String(valor).trim());
    return Number.isInteger(n) && n >= 0 ? n : null;
  }

  function setBusy(el, busy = true) {
    if (!el) return;
    el.disabled = !!busy;
    el.classList.toggle("is-busy", !!busy);
    if (busy) {
      el.dataset._oldText = el.textContent;
      el.textContent = "Guardando…";
    } else {
      if (el.dataset._oldText) el.textContent = el.dataset._oldText;
    }
  }

  function flash(el, cls = "ok") {
    if (!el) return;
    el.classList.remove("ok", "error", "warn");
    // Forzar reflow para reiniciar animación si existe CSS asociado
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 1200);
  }

  function findRowByEstudianteId(estudianteId) {
    return document.querySelector(`[data-row-estudiante="${estudianteId}"]`);
  }

  function showRowStatus(row, mensaje, tipo = "ok") {
    if (!row) {
      // Fallback: alert silencioso en consola
      console[tipo === "ok" ? "log" : "warn"]("[STATUS]", mensaje);
      return;
    }
    let box = row.querySelector(".row-status");
    if (!box) {
      box = document.createElement("div");
      box.className = "row-status";
      // Estilos mínimos inline para no depender de CSS extra
      box.style.fontSize = "12px";
      box.style.marginTop = "4px";
      row.appendChild(box);
    }
    box.textContent = mensaje;
    box.style.color = tipo === "ok" ? "#0a7d2c" : (tipo === "warn" ? "#b36b00" : "#b51415");
    flash(row, tipo === "ok" ? "ok" : (tipo === "warn" ? "warn" : "error"));
  }

  async function postForm(url, data) {
    const csrftoken = getCookie("csrftoken");
    const form = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => form.append(k, v));
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken || "",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      credentials: "same-origin",
      body: form.toString(),
    });
    let json = null;
    try { json = await resp.json(); } catch { /* no-op */ }
    if (!resp.ok) {
      const msg = (json && json.msg) ? json.msg : `Error ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.payload = json;
      throw err;
    }
    return json || {};
  }

  // ====== VALIDACIONES DE NEGOCIO ======
  function validarNotaYFallas(notaNum, fallasNum) {
    if (notaNum == null || Number.isNaN(notaNum)) {
      return "La nota es obligatoria.";
    }
    if (notaNum < 1.00 || notaNum > 5.00) {
      return "La nota debe estar entre 1.00 y 5.00.";
    }
    // dos decimales
    const s = notaNum.toFixed(2);
    if (!/^\d+(\.\d{2})$/.test(String(s))) {
      return "La nota debe tener dos decimales.";
    }
    if (fallasNum == null || Number.isNaN(fallasNum) || fallasNum < 0) {
      return "Las fallas deben ser un entero ≥ 0.";
    }
    return null; // ok
  }

  // ====== API PÚBLICA ======
  async function guardarNota(/* firma flexible: ver cabecera */) {
    // Normalizar parámetros (acepta firma tradicional o por objeto)
    let estudianteId, asignaturaId, periodoId, nota, fallas = 0, row = null, btn = null;

    if (arguments.length === 1 && typeof arguments[0] === "object") {
      const o = arguments[0];
      estudianteId  = String(o.estudiante_id ?? o.estudianteId ?? "").trim();
      asignaturaId  = String(o.asignatura_id ?? o.asignaturaId ?? "").trim();
      periodoId     = String(o.periodo_id ?? o.periodoId ?? "").trim();
      nota          = o.nota;
      fallas        = o.fallas ?? 0;
      row           = o.row || null;
      btn           = o.btn || null;
    } else {
      // Forma clásica: (estudianteId, asignaturaId, periodoId, inputNotaEl, inputFallasEl, botonEl?)
      estudianteId = String(arguments[0] ?? "").trim();
      asignaturaId = String(arguments[1] ?? "").trim();
      periodoId    = String(arguments[2] ?? "").trim();
      const notaEl    = arguments[3];
      const fallasEl  = arguments[4];
      btn             = arguments[5] || null;

      const notaVal   = notaEl && notaEl.value != null ? notaEl.value : notaEl;
      const fallasVal = fallasEl && fallasEl.value != null ? fallasEl.value : fallasEl;
      nota   = parseNota(notaVal);
      fallas = parseFallas(fallasVal);
      // fila contenedora (si existe)
      row = (notaEl && notaEl.closest) ? notaEl.closest("[data-row-estudiante]") : null;
      if (!row && typeof estudianteId === "string" && estudianteId) {
        row = findRowByEstudianteId(estudianteId);
      }
    }

    // Validaciones mínimas de ids
    const idRegex = /^\d{1,10}$/;
    if (!idRegex.test(estudianteId) || !idRegex.test(asignaturaId) || !idRegex.test(periodoId)) {
      showRowStatus(row, "IDs inválidos.", "error");
      return;
    }

    // Validaciones de negocio
    const notaNum = typeof nota === "number" ? nota : parseNota(nota);
    const fallasNum = typeof fallas === "number" ? fallas : parseFallas(fallas);
    const errVal = validarNotaYFallas(notaNum, fallasNum);
    if (errVal) {
      showRowStatus(row, errVal, "warn");
      return;
    }

    // UI busy
    setBusy(btn, true);

    try {
      const payload = {
        estudiante_id: estudianteId,
        asignatura_id: asignaturaId,
        periodo_id:    periodoId,
        nota:          notaNum.toFixed(2),
        fallas:        String(fallasNum),
      };

      const res = await postForm(REGISTRAR_NOTA_URL, payload);
      const accion = (res && res.accion) || "UPDATE";
      showRowStatus(row, accion === "INSERT" ? "Nota creada." : "Nota actualizada.", "ok");

      // opcional: marcar inputs como “guardados”
      if (row) {
        const notaInput = row.querySelector(".inp-nota");
        if (notaInput) notaInput.dataset.savedValue = notaNum.toFixed(2);
        const fallasInput = row.querySelector(".inp-fallas");
        if (fallasInput) fallasInput.dataset.savedValue = String(fallasNum);
      }

    } catch (e) {
      const msg = (e && e.message) ? e.message : "Error al guardar.";
      showRowStatus(row, msg, "error");
      console.error("[DOCENTE guardarNota] ", e);

    } finally {
      setBusy(btn, false);
    }
  }

  // Exponer en window (para plantillas que llaman a guardarNota desde HTML)
  window.guardarNota = guardarNota;
  window.REGISTRAR_NOTA_URL = REGISTRAR_NOTA_URL;

  // ====== AUTO-ENLAZADO OPCIONAL POR data-* ======
  // Si tu plantilla tiene botones con data-guardar-nota y filas con data-row-estudiante,
  // esto activa el click sin que tengas que escribir JS adicional.
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-guardar-nota]");
    if (!btn) return;

    const row = btn.closest("[data-row-estudiante]");
    if (!row) return;

    const estudianteId = row.getAttribute("data-row-estudiante");
    const asignaturaId = row.getAttribute("data-asignatura-id") || btn.getAttribute("data-asignatura-id");
    const periodoId    = row.getAttribute("data-periodo-id")    || btn.getAttribute("data-periodo-id");

    const notaEl   = row.querySelector(".inp-nota");
    const fallasEl = row.querySelector(".inp-fallas");

    if (!estudianteId || !asignaturaId || !periodoId) {
      showRowStatus(row, "Faltan parámetros para guardar.", "warn");
      return;
    }

    guardarNota(estudianteId, asignaturaId, periodoId, notaEl, fallasEl, btn);
  });

  // ====== MARCADO VISUAL DE CAMBIOS (opcional) ======
  // Si el usuario cambia la nota/fallas, resalta la fila hasta que guarde.
  function setupChangeMarkers(root = document) {
    const markDirty = (inp) => {
      const row = inp.closest("[data-row-estudiante]");
      if (!row) return;
      const saved = inp.dataset.savedValue ?? "";
      const current = String(inp.value ?? "").trim();
      const changed = saved !== current;
      row.classList.toggle("dirty", changed);
    };
    $all(".inp-nota, .inp-fallas", root).forEach(inp => {
      inp.addEventListener("input", () => markDirty(inp));
      // inicial
      markDirty(inp);
    });
  }

  // Ejecutar en carga (no falla si no hay inputs)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setupChangeMarkers());
  } else {
    setupChangeMarkers();
  }
})();
