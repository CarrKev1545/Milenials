/* static/core/js/registro_notas_api.js */

/** Ruta absoluta del endpoint (funciona en local y producción) */
const REGISTRAR_NOTA_URL = window.location.origin + "/rector/notas/registrar";

/** Lee el token CSRF desde un form oculto (#csrf-holder o #csrf-form) o desde cookie */
function getCSRF() {
  const byHolder =
    document.querySelector('#csrf-holder input[name="csrfmiddlewaretoken"]') ||
    document.querySelector('#csrf-form input[name="csrfmiddlewaretoken"]') ||
    document.querySelector('input[name="csrfmiddlewaretoken"]');
  if (byHolder && byHolder.value) return byHolder.value;

  // Fallback: cookie csrftoken
  const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/** Normaliza a string seguro para FormData */
function _s(v) {
  return v === null || typeof v === "undefined" ? "" : String(v);
}

/**
 * Guarda/actualiza una nota en el servidor.
 * Retorna un objeto normalizado:
 *   { ok: true,  accion: 'INSERT'|'UPDATE', nota_id?, msg? }
 *   { ok: false, error: 'mensaje' }
 */
async function guardarNota(estudiante_id, asignatura_id, periodo_id, nota, fallas = 0) {
  try {
    // Normalización de valores
    const est = _s(estudiante_id);
    const asig = _s(asignatura_id);
    const per  = _s(periodo_id);

    // Nota y fallas en formato numérico seguro
    let n = (nota === "" || nota === null || typeof nota === "undefined") ? "" : Number(nota);
    let f = (fallas === "" || fallas === null || typeof fallas === "undefined") ? 0 : Number(fallas);

    // Prepara el body como FormData (compatible con el view Django)
    const fd = new FormData();
    fd.append("estudiante_id", est);
    fd.append("asignatura_id", asig);
    fd.append("periodo_id", per);
    fd.append("nota", _s(n));     // si está vacío quedará "", el view lo puede tratar como null
    fd.append("fallas", _s(f));   // entero ≥ 0

    const resp = await fetch(REGISTRAR_NOTA_URL, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRF(),
      },
      body: fd,
      credentials: "same-origin",
    });

    let data = null;
    try { 
      data = await resp.json(); 
    } catch (_) { 
      data = null; 
    }

    // Normaliza la respuesta
    if (resp.ok && data && (data.ok === true || data.success === true)) {
      return {
        ok: true,
        accion: data.accion || data.action || null,
        nota_id: data.nota_id || null,
        msg: data.msg || "OK",
      };
    } else {
      const error =
        (data && (data.error || data.detail || data.msg)) ||
        `HTTP ${resp.status}`;
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err?.message || "Error de red" };
  }
}

// Export opcional (si usas módulos ES en alguna vista):
// export { guardarNota, getCSRF };
