/* ==========================================================
   Boletín – JS con colores por categoría MEN (S, A, Bs, Bj)
   ========================================================== */

/* Helpers cortos */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const txt = (el) => (el?.textContent || "").trim();

/* -------- 0) Fecha por defecto (solo si falta) -------- */
(function setDefaultDate(){
  const cand = $('[data-field="fecha"]'); // si existe
  if (cand && !txt(cand)) {
    const d = new Date(), p = n => String(n).padStart(2,'0');
    cand.textContent = `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}`;
  }
})();

/* -------- Utilidades numéricas y MEN -------- */
const r1 = (n) => (n==null || isNaN(n)) ? "" : (Math.round(n*10)/10).toFixed(1); // 1 decimal
const MEN = { S: 4.6, A: 4.0, Bs: 3.0 }; // Bj < 3.0
function menFor(v){
  if (v==null || isNaN(v)) return "";
  if (v >= MEN.S)  return "S";
  if (v >= MEN.A)  return "A";
  if (v >= MEN.Bs) return "Bs";
  return "Bj";
}
/* Regla de pérdida: general <3.0, Inglés <3.5 */
function esPerdida(nombre, valor){
  if (valor == null || isNaN(valor)) return false;
  const n = (nombre || "").toUpperCase();
  const umbral = n.includes("INGLES") || n.includes("INGLÉS") ? 3.5 : 3.0;
  return valor < umbral;
}

/* -------- 1) Mapeo de columnas por encabezado -------- */
function detectarColumnas(table) {
  const ths = $$("thead th", table).map(th => txt(th).toUpperCase());
  const find = (label) => ths.findIndex(t => t.includes(label));
  return {
    area:  find("ÁREA") >= 0 ? find("ÁREA") : 0,
    p1:    find("P1"),
    p2:    find("P2"),
    p3:    find("P3"),
    final: find("FINAL"),
    nivel: find("NIVEL"),
    fallas:find("FALLAS"),
  };
}

/* -------- 2) Colorear una celda según la categoría MEN -------- */
function claseCategoria(nombreAsignatura, valor){
  if (valor==null || isNaN(valor)) return "";
  // Si pierde (Inglés <3.5, demás <3.0) mostramos siempre BJ en rojo:
  if (esPerdida(nombreAsignatura, valor)) return "nota-Bj";
  const mn = menFor(valor);
  if (mn === "S")  return "nota-S";
  if (mn === "A")  return "nota-A";
  if (mn === "Bs") return "nota-Bs";
  return "nota-Bj";
}
function pintaCelda(td, nombreAsignatura, valor){
  if (!td) return;
  // limpiamos clases previas
  ["nota-S","nota-A","nota-Bs","nota-Bj","nota-aprobada","nota-reprobada","nota-roja"]
    .forEach(c=>td.classList.remove(c));
  if (valor==null || isNaN(valor)) return;
  td.classList.add(claseCategoria(nombreAsignatura, valor));
  // Compatibilidad con tu CSS previo (verde/rojo):
  td.classList.add(esPerdida(nombreAsignatura, valor) ? "nota-reprobada" : "nota-aprobada");
}

/* -------- 3) Recalcular FINAL y NIVEL por fila + promedio general -------- */
function recalcTable(){
  const table = $("#tablaNotas");
  if (!table) return;

  const idx = detectarColumnas(table);
  const filas = $$("tbody tr", table);
  const areaProms = [];

  filas.forEach(tr => {
    const tds = $$("td", tr);
    if (!tds.length) return;

    const nombre = txt(tds[idx.area]);

    // leer P1..P3
    const vP1 = parseFloat((idx.p1>=0 ? txt(tds[idx.p1]) : "").replace(",", "."));
    const vP2 = parseFloat((idx.p2>=0 ? txt(tds[idx.p2]) : "").replace(",", "."));
    const vP3 = parseFloat((idx.p3>=0 ? txt(tds[idx.p3]) : "").replace(",", "."));
    const vals = [vP1, vP2, vP3].filter(v => !isNaN(v));
    const avg  = vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : NaN;

    // FINAL
    if (idx.final >= 0) {
      tds[idx.final].textContent = r1(avg);
      pintaCelda(tds[idx.final], nombre, avg);
    }

    // NIVEL
    if (idx.nivel >= 0) {
      const nivel = menFor(avg);
      tds[idx.nivel].textContent = nivel;
      pintaCelda(tds[idx.nivel], nombre, avg);
    }

    // Pintar pérdidas/categoría por periodo
    if (idx.p1 >= 0) pintaCelda(tds[idx.p1], nombre, vP1);
    if (idx.p2 >= 0) pintaCelda(tds[idx.p2], nombre, vP2);
    if (idx.p3 >= 0) pintaCelda(tds[idx.p3], nombre, vP3);

    // Capturar promedios de ÁREA (filas con class="area-row")
    if (tr.classList.contains("area-row") && !isNaN(avg)) {
      areaProms.push(avg);
      if (idx.fallas >= 0) tds[idx.fallas].textContent = "";
    }
  });

  // Promedio general (promedio de áreas)
  const prom = areaProms.length ? (areaProms.reduce((a,b)=>a+b,0) / areaProms.length) : NaN;
  const promBoxes = $$(".metric .metric-top");
  const cardProm = promBoxes.find(el => txt(el).toUpperCase().includes("PROMEDIO"));
  if (cardProm) {
    const main = cardProm.parentElement.querySelector(".metric-main");
    if (main) main.textContent = isNaN(prom) ? "—" : r1(prom);
  }
}

/* -------- 4) Metadatos para Excel -------- */
function getMeta(){
  const meta = {};
  $$("[data-field]").forEach(s => {
    meta[s.getAttribute("data-field")] = txt(s);
  });

  const leerFila = (label) => {
    const row = $$(".meta .row").find(r => txt($(".k", r)) === label);
    return row ? txt($(".value", row)) : "";
  };
  const leerMini = (label) => {
    const row = $$(".meta-right .mini-row").find(r => txt($(".k", r)) === label);
    return row ? txt($(".value", row)) : "";
  };

  meta.apellidos      ||= leerFila("Apellidos:");
  meta.nombres        ||= leerFila("Nombres:");
  meta.identificacion ||= leerFila("Identificación:");
  meta.sede           ||= leerFila("Sede:");
  meta.jornada        ||= leerMini("Jornada:");
  meta.anio           ||= leerMini("Año:");
  meta.periodo        ||= leerMini("Periodo:");
  meta.grado          ||= leerMini("Grado:");
  meta.grupo          ||= leerMini("Grupo:");
  meta.fecha          ||= (leerMini("Fecha de creación:") || txt($('[data-field="fecha"]')));
  return meta;
}

/* -------- 5) Exportar a Excel -------- */
function exportToExcel(){
  const meta = getMeta();

  const encabezado = `
    <table border="1" cellspacing="0" cellpadding="4">
      <tr><th colspan="4" style="font-size:16px;background:#E6F5EA">Boletín Académico</th></tr>
      <tr><td><b>Apellidos</b></td><td>${meta.apellidos||""}</td><td><b>Nombres</b></td><td>${meta.nombres||""}</td></tr>
      <tr><td><b>Identificación</b></td><td>${meta.identificacion||""}</td><td><b>Sede</b></td><td>${meta.sede||""}</td></tr>
      <tr><td><b>Jornada</b></td><td>${meta.jornada||""}</td><td><b>Año</b></td><td>${meta.anio||""}</td></tr>
      <tr><td><b>Periodo</b></td><td>${meta.periodo||""}</td><td><b>Grado</b></td><td>${meta.grado||""}</td></tr>
      <tr><td><b>Grupo</b></td><td>${meta.grupo||""}</td><td><b>Fecha creación</b></td><td>${meta.fecha||""}</td></tr>
    </table><br/>`;

  const table = $("#tablaNotas");
  if (!table) return alert("No se encontró la tabla de notas.");
  const clone = table.cloneNode(true);
  $$("*", clone).forEach(el => { el.removeAttribute("class"); el.removeAttribute("style"); });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>${encabezado}${clone.outerHTML}</body>
    </html>`;

  const blob = new Blob(["\ufeff", html], {type:"application/vnd.ms-excel"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const nombre = `Boletin_${(meta.apellidos||'')}_${(meta.nombres||'')}.xls`.replace(/\s+/g,'_');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); a.remove();
}

/* -------- 6) Exportar a PDF -------- */
async function exportToPDF(){
  const cont = $("#paginaBoletin");
  if(!cont){ alert('No se encontró el contenedor #paginaBoletin'); return; }

  const images = Array.from(document.images || []);
  await Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    return (img.decode ? img.decode() : new Promise(res => {
      img.onload = res; img.onerror = res;
    })).catch(()=>{});
  }));

  document.body.classList.add('exporting');

  const meta = getMeta();
  const ap = (meta.apellidos||"Alumno").replace(/\s+/g,'_');
  const no = (meta.nombres||"").replace(/\s+/g,'_');
  const filename = `Boletin_${ap}${no?`_${no}`:''}.pdf`;

  if (!window.html2pdf) {
    window.print();
    document.body.classList.remove('exporting');
    return;
  }

  const opt = {
    margin: [20, 12, 20, 12],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  await window.html2pdf().set(opt).from(cont).toPdf().get('pdf').then((pdf) => {
    const total = pdf.getNumberOfPages();
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    const drawHeader = (page) => {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(30, 30, 30);
      pdf.text('IE Departamental Gustavo Uribe Ramírez', W/2, 12, { align: 'center' });
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(90);
      pdf.text('Secretaría de Educación de Cundinamarca – Granada', W/2, 16, { align: 'center' });
      pdf.setDrawColor(43, 122, 11); pdf.setLineWidth(0.8); pdf.line(12, 18.5, W - 12, 18.5);
    };

    const drawFooter = (page) => {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(90);
      pdf.text('Convenciones: S=Superior, A=Alto, Bs=Básico, Bj=Bajo', W/2, H - 10, { align: 'center' });
    };

    for (let p = 1; p <= total; p++) {
      if (p > 1) drawHeader(p);
      drawFooter(p);
    }
  }).save().finally(() => {
    document.body.classList.remove('exporting');
  });
}

/* -------- 7) Wire-up -------- */
(function init(){
  try { recalcTable(); } catch(e){ /* noop */ }

  const bExcel = $("#btnExcel");
  const bPDF   = $("#btnPDF");
  if (bExcel) bExcel.addEventListener("click", (e) => { e.preventDefault(); exportToExcel(); });
  if (bPDF)   bPDF.addEventListener("click",   (e) => { e.preventDefault(); exportToPDF();   });
})();
