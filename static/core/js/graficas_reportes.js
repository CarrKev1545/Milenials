// graficas_reportes.js
(function () {
  const $ = (s) => document.querySelector(s);

  // --- Selectores
  const selSede = $("#f-sede");
  const selGrado = $("#f-grado");
  const selGrupo = $("#f-grupo");
  const selPeriodo = $("#f-periodo");
  const selThreshold = $("#f-threshold");

  // --- Utilidades
  async function fetchJSON(url) {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) throw new Error(r.status + " " + url);
    return r.json();
  }
  function clearSelect(sel, ph) {
    if (!sel) return;
    sel.innerHTML = `<option value="">${ph}</option>`;
  }
  function disable(sel, on) {
    if (!sel) return;
    sel.disabled = !!on;
  }

  // --- URLs inyectadas desde el template
  const URLS = (typeof window !== "undefined" && window.GR_URLS) || {};
  const URL_API_SEDES = URLS.api_sedes;
  const URL_API_GRADOS = URLS.api_grados_por_sede;
  const URL_API_GRUPOS = URLS.api_grupos_por_sede_grado;
  const URL_API_ACTIVOS = URLS.api_metrics_activos;
  const URL_API_REPROB = URLS.api_metrics_reprobados || "/api/metrics/reprobados";

  if (!URL_API_SEDES || !URL_API_GRADOS || !URL_API_GRUPOS || !URL_API_ACTIVOS) {
    console.warn("Faltan URLs en window.GR_URLS. Revisa el bloque extra_js del template.");
  }

  // --- Mapa id -> nombre de sede (el backend de activos espera nombre en 'sede')
  const SEDE_NAME_BY_ID = Object.create(null);

  // ---------- CARGA DE DATOS DE FILTROS ----------
  async function loadSedes() {
    clearSelect(selSede, "Todas las sedes");
    if (!URL_API_SEDES || !selSede) return;

    try {
      const data = await fetchJSON(URL_API_SEDES);
      (data.sedes || []).forEach((s) => {
        const o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.nombre;
        SEDE_NAME_BY_ID[s.id] = s.nombre;
        selSede.appendChild(o);
      });
    } catch (e) {
      console.warn("No se pudieron cargar sedes", e);
    }
  }

  async function loadGrados() {
    const sede_id = selSede.value || "";
    clearSelect(selGrado, "Todos los grados");
    clearSelect(selGrupo, "Todos los grupos");
    disable(selGrado, !sede_id);
    disable(selGrupo, true);

    if (!sede_id || !URL_API_GRADOS) return;

    try {
      const data = await fetchJSON(`${URL_API_GRADOS}?sede_id=${encodeURIComponent(sede_id)}`);
      (data.grados || []).forEach((g) => {
        const o = document.createElement("option");
        o.value = g.id;
        o.textContent = g.nombre;
        selGrado.appendChild(o);
      });
    } catch (e) {
      console.warn("No se pudieron cargar grados", e);
    }
  }

  async function loadGrupos() {
    const sede_id = selSede.value || "";
    const grado_id = selGrado.value || "";
    clearSelect(selGrupo, "Todos los grupos");
    disable(selGrupo, !grado_id);

    if (!grado_id || !URL_API_GRUPOS) return;

    try {
      const data = await fetchJSON(
        `${URL_API_GRUPOS}?sede_id=${encodeURIComponent(sede_id)}&grado_id=${encodeURIComponent(grado_id)}`
      );
      (data.grupos || []).forEach((g) => {
        const o = document.createElement("option");
        o.value = g.id;
        o.textContent = g.nombre;
        selGrupo.appendChild(o);
      });
    } catch (e) {
      console.warn("No se pudieron cargar grupos", e);
    }
  }

  // Intenta cargar periodos desde backend docente (que ya tienes); si no, fallback 1-4
  async function loadPeriodos() {
    if (!selPeriodo) return;
    clearSelect(selPeriodo, "Todos los periodos");

    try {
      // Intento: tu endpoint existente en logs: /api/docente/periodos-abiertos
      const res = await fetch("/api/docente/periodos-abiertos", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        (data.periodos || []).forEach((p) => {
          const o = document.createElement("option");
          o.value = p.id;        // id real del periodo
          o.textContent = p.nombre; // nombre legible
          selPeriodo.appendChild(o);
        });
        return;
      }
    } catch (e) {
      // ignore y usar fallback
    }

    // Fallback (1 a 4) si no hay endpoint
    [1, 2, 3, 4].forEach((pid) => {
      const o = document.createElement("option");
      o.value = String(pid);
      o.textContent = `Periodo ${pid}`;
      selPeriodo.appendChild(o);
    });
  }

  // ---------- GRÁFICO: ACTIVOS POR SEDE ----------
  const ECH = typeof window !== "undefined" ? window.echarts : null;
  let chartActivos = null;

  function ensureChartActivos() {
    if (!ECH) return null;
    if (!chartActivos) {
      const el = document.getElementById("chart-activos-sede");
      if (!el) return null;
      chartActivos = ECH.init(el, null, { renderer: "canvas" });
      window.addEventListener("resize", () => chartActivos && chartActivos.resize());
    }
    return chartActivos;
  }

  async function renderActivos() {
    const sede_id = selSede?.value || "";
    const grupo_id = selGrupo?.value || "";

    const params = new URLSearchParams();

    // El endpoint de "activos" quiere 'sede' por nombre, no por id
    if (sede_id) {
      const sedeNombre =
        SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "";
      if (sedeNombre) params.append("sede", sedeNombre);
    }
    if (grupo_id) params.append("grupo_id", grupo_id);

    try {
      const url = URL_API_ACTIVOS + (params.toString() ? "?" + params.toString() : "");
      const data = await fetchJSON(url);
      const series = data.series || [];
      const names = series.map((s) => s.name);
      const values = series.map((s) => s.value);

      const chart = ensureChartActivos();
      if (!chart) return;

      chart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 16, top: 24, bottom: 40 },
        xAxis: { type: "category", data: names, axisLabel: { rotate: 10 } },
        yAxis: { type: "value" },
        series: [
          {
            name: "Activos",
            type: "bar",
            data: values,
            barMaxWidth: 36,
            itemStyle: { borderRadius: [6, 6, 0, 0] },
          },
        ],
      });
    } catch (e) {
      console.error(e);
      const chart = ensureChartActivos();
      chart && chart.setOption({ title: { text: "No se pudo cargar", left: "center" } });
    }

    // Refrescar el otro gráfico con los mismos filtros
    refreshReprobados();
  }

  // ---------- GRÁFICO: HISTOGRAMA DE NOTAS ----------
  const elChartHist = document.getElementById("chart-histograma-notas");
  let chartHist = ECH && elChartHist ? ECH.init(elChartHist) : null;

  async function fetchHistograma(params) {
    const qs = new URLSearchParams();
    if (params?.sede) qs.set("sede", params.sede);
    if (params?.grupo_id) qs.set("grupo_id", params.grupo_id);
    if (params?.periodo_id) qs.set("periodo_id", params.periodo_id);

    const url = "/api/metrics/histograma?" + qs.toString();
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("Error al cargar histograma");
    return res.json();
  }

  async function refreshHistograma() {
    if (!chartHist) return;
    chartHist.showLoading("default", { text: "Cargando..." });

    try {
      const sede_id = selSede?.value || "";
      const grupo_id = selGrupo?.value || "";
      const periodo_id = selPeriodo?.value || "";

      const sedeNombre =
        sede_id ? (SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "") : "";

      const data = await fetchHistograma({ sede: sedeNombre, grupo_id, periodo_id });
      const series = data.series || [];
      const labels = series.map((s) => s.name);
      const values = series.map((s) => s.value);

      chartHist.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 30, bottom: 40 },
        xAxis: {
          type: "category",
          data: labels,
          name: "Nota",
          axisLabel: { rotate: 0 },
        },
        yAxis: { type: "value", name: "Cantidad" },
        series: [
          {
            name: "Estudiantes",
            type: "bar",
            data: values,
            itemStyle: { color: "#2e9afe", borderRadius: [4, 4, 0, 0] },
          },
        ],
      });
    } catch (err) {
      console.error(err);
      chartHist.setOption({ title: { text: "No se pudo cargar", left: "center" } });
    } finally {
      chartHist.hideLoading();
    }
  }

  // Conectar al cambio de filtros
  selPeriodo?.addEventListener("change", refreshHistograma);
  selSede?.addEventListener("change", refreshHistograma);
  selGrado?.addEventListener("change", refreshHistograma);
  selGrupo?.addEventListener("change", refreshHistograma);

  // Resize
  if (chartHist) {
    window.addEventListener("resize", () => chartHist && chartHist.resize());
  }

  // Eventos de filtros base
  selSede?.addEventListener("change", async () => {
    await loadGrados();
    await loadGrupos();
    renderActivos();
  });
  selGrado?.addEventListener("change", async () => {
    await loadGrupos();
    renderActivos();
  });
  selGrupo?.addEventListener("change", renderActivos);

  // ---------- GRÁFICO: REPROBADOS POR ASIGNATURA ----------
  const elChartReprob = document.getElementById("chart-reprobados");
  let chartReprob = ECH && elChartReprob ? ECH.init(elChartReprob) : null;

  async function fetchReprobados(params) {
    // params: { sede, grado_id, grupo_id, periodo_id, threshold }
    const qs = new URLSearchParams();
    if (params?.sede) qs.set("sede", params.sede);
    if (params?.grado_id) qs.set("grado_id", params.grado_id);
    if (params?.grupo_id) qs.set("grupo_id", params.grupo_id);
    if (params?.periodo_id) qs.set("periodo_id", params.periodo_id);
    if (params?.threshold) qs.set("threshold", params.threshold);
    const r = await fetch(`${URL_API_REPROB}?${qs.toString()}`, { credentials: "same-origin" });
    if (!r.ok) throw new Error("Error reprobados");
    return r.json();
  }

  function renderReprobadosChart(data) {
    if (!chartReprob) return;
    const series = data.series || [];
    const names = series.map((s) => s.name);
    const values = series.map((s) => s.value);

    chartReprob.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 30, bottom: 50 },
      xAxis: { type: "category", data: names, axisLabel: { rotate: 20 } },
      yAxis: { type: "value", name: "Estudiantes" },
      series: [
        {
          name: "Reprobados",
          type: "bar",
          data: values,
          barWidth: "60%",
          itemStyle: { borderRadius: [6, 6, 0, 0] },
        },
      ],
    });
  }

  async function refreshReprobados() {
    if (!chartReprob) return;
    chartReprob.showLoading("default", { text: "Cargando..." });
    try {
      const sede_id = selSede?.value || "";
      const grado_id = selGrado?.value || "";
      const grupo_id = selGrupo?.value || "";
      const periodo_id = selPeriodo?.value || "";     // NUEVO
      const threshold = selThreshold?.value || "3.0"; // NUEVO

      // Para 'sede', aquí sí enviamos el nombre si lo hay (coherente con activos)
      const sedeNombre =
        sede_id ? (SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "") : "";

      const data = await fetchReprobados({
        sede: sedeNombre,
        grado_id,
        grupo_id,
        periodo_id,
        threshold,
      });
      renderReprobadosChart(data);
    } catch (err) {
      console.error(err);
      renderReprobadosChart({ series: [] });
    } finally {
      chartReprob.hideLoading();
    }
  }

  // Eventos de los NUEVOS filtros
  selPeriodo?.addEventListener("change", refreshReprobados);
  selThreshold?.addEventListener("change", refreshReprobados);

  // ---------- Init ----------
  (async function init() {
    await loadSedes();
    await loadPeriodos(); // nuevo
    renderActivos();      // esto también refresca reprobados
    if (chartReprob) {
      window.addEventListener("resize", () => chartReprob && chartReprob.resize());
    }
  })();
})();

// ===================================================================
// 📊 GRÁFICAS Y REPORTES — RECTOR / ADMINISTRATIVO
// Basado en ECharts 5.x
// ===================================================================

const ECH = window.echarts;
const selSede = document.querySelector("#f-sede");
const selGrado = document.querySelector("#f-grado");
const selGrupo = document.querySelector("#f-grupo");
const selPeriodo = document.querySelector("#f-periodo");
const selHistMode = document.querySelector("#hist-mode");
let histMode = "bar";

const SEDE_NAME_BY_ID = {};
const GR_URLS = window.GR_URLS || {};

// ---------------------------------------------------------------
// UTILIDAD AJAX SIMPLE
async function fetchJSON(url, params = {}) {
  const qs = new URLSearchParams(params);
  const fullUrl = url + (qs.toString() ? `?${qs}` : "");
  const res = await fetch(fullUrl, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Error al consultar ${url}`);
  return res.json();
}

// ===================================================================
// 1️⃣ GRÁFICO — ESTUDIANTES ACTIVOS POR SEDE
// ===================================================================
const chart1 = ECH.init(document.getElementById("chart-activos-sede"));
async function refreshActivos() {
  chart1.showLoading();
  try {
    const sedeNombre = selSede?.options[selSede.selectedIndex]?.text || "";
    const grupo_id = selGrupo?.value || "";
    const data = await fetchJSON(GR_URLS.api_metrics_activos, {
      sede: sedeNombre,
      grupo_id,
    });

    const labels = data.series.map((s) => s.name);
    const values = data.series.map((s) => s.value);

    chart1.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: labels },
      yAxis: { type: "value" },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: { color: "#1E88E5", borderRadius: [6, 6, 0, 0] },
        },
      ],
    });
  } catch (err) {
    console.error(err);
  } finally {
    chart1.hideLoading();
  }
}

// ===================================================================
// 2️⃣ GRÁFICO — REPROBADOS POR ASIGNATURA
// ===================================================================
const chart2 = ECH.init(document.getElementById("chart-reprobados"));
async function refreshReprobados() {
  chart2.showLoading();
  try {
    const sedeNombre = selSede?.options[selSede.selectedIndex]?.text || "";
    const grupo_id = selGrupo?.value || "";
    const periodo_id = selPeriodo?.value || "";

    const data = await fetchJSON("/api/metrics/reprobados", {
      sede: sedeNombre,
      grupo_id,
      periodo_id,
    });

    const labels = data.series.map((s) => s.name);
    const values = data.series.map((s) => s.value);

    chart2.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: labels },
      yAxis: { type: "value" },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: { color: "#e53935", borderRadius: [6, 6, 0, 0] },
        },
      ],
    });
  } catch (err) {
    console.error(err);
  } finally {
    chart2.hideLoading();
  }
}

// === HISTOGRAMA DE NOTAS ==========================================
(function () {
  const ECH = window.echarts;
  const el = document.getElementById("chart-histograma-notas");
  if (!ECH || !el) return;

  const selSede    = document.querySelector("#f-sede");
  const selGrado   = document.querySelector("#f-grado");
  const selGrupo   = document.querySelector("#f-grupo");
  const selPeriodo = document.querySelector("#f-periodo");
  const selHistMode = document.querySelector("#hist-mode"); // opcional (barra/línea)

  let histMode = selHistMode?.value || "bar";
  const GR_URLS = window.GR_URLS || {};
  const API_HISTO = GR_URLS.api_metrics_histograma || "/api/metrics/histograma";

  // Mapa id->nombre de sede (si ya lo generas en otro lugar puedes reutilizarlo)
  const SEDE_NAME_BY_ID = window.SEDE_NAME_BY_ID || {};

  const chart = ECH.init(el, null, { renderer: "canvas" });
  window.addEventListener("resize", () => chart.resize());

  function setOption(labels, values, titleText = "") {
    const isLine = (histMode === "line");
    chart.setOption({
      backgroundColor: "transparent",
      title: titleText ? { text: titleText, left: "center", textStyle: { fontSize: 12 } } : undefined,
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 30, bottom: 40 },
      xAxis: { type: "category", data: labels, name: "Nota" },
      yAxis: { type: "value", name: "Cantidad" },
      series: [{
        name: "Estudiantes",
        type: isLine ? "line" : "bar",
        data: values,
        smooth: isLine,
        areaStyle: isLine ? {} : null,
        itemStyle: isLine
          ? { color: "#26A69A" }
          : { color: "#26A69A", borderRadius: [6, 6, 0, 0] },
        symbol: isLine ? "circle" : "none",
      }]
    });
  }

  async function fetchJSON(url, params = {}) {
    const qs = new URLSearchParams(params);
    const full = url + (qs.toString() ? "?" + qs : "");
    const res = await fetch(full, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${full}`);
    return res.json();
  }

  async function refresh() {
    chart.showLoading("default", { text: "Cargando..." });
    try {
      const sede_id    = selSede?.value || "";
      const grupo_id   = selGrupo?.value || "";
      const periodo_id = selPeriodo?.value || "";

      // El backend filtra por NOMBRE de sede
      const sedeNombre = sede_id
        ? (SEDE_NAME_BY_ID[sede_id] || selSede?.options[selSede.selectedIndex]?.text || "")
        : "";

      const data = await fetchJSON(API_HISTO, {
        sede: sedeNombre,
        grupo_id,
        periodo_id,
      });

      const series = Array.isArray(data?.series) ? data.series : [];
      const labels = series.map((s) => s.name);
      const values = series.map((s) => s.value);

      if (labels.length === 0) {
        // Pinta ejes vacíos con un aviso
        const defaultLabels = ["1.0","1.5","2.0","2.5","3.0","3.5","4.0","4.5","5.0"];
        const zeros = new Array(defaultLabels.length).fill(0);
        setOption(defaultLabels, zeros, "Sin datos para los filtros seleccionados");
      } else {
        setOption(labels, values);
      }
    } catch (err) {
      console.error("[histograma] error:", err);
      // Pinta ejes vacíos con aviso de error
      const defaultLabels = ["1.0","1.5","2.0","2.5","3.0","3.5","4.0","4.5","5.0"];
      const zeros = new Array(defaultLabels.length).fill(0);
      setOption(defaultLabels, zeros, "No se pudo cargar");
    } finally {
      chart.hideLoading();
    }
  }

  // Eventos
  selSede?.addEventListener("change", refresh);
  selGrado?.addEventListener("change", refresh);  // por si decides usarlo
  selGrupo?.addEventListener("change", refresh);
  selPeriodo?.addEventListener("change", refresh);
  selHistMode?.addEventListener("change", () => {
    histMode = selHistMode.value || "bar";
    refresh();
  });

  // Inicio
  refresh();
})();


// ===================================================================
// 🔁 EVENTOS Y REFRESCOS
// ===================================================================
const refreshAll = () => {
  refreshActivos();
  refreshReprobados();
  refreshHistograma();
};

selSede?.addEventListener("change", refreshAll);
selGrado?.addEventListener("change", refreshAll);
selGrupo?.addEventListener("change", refreshAll);
selPeriodo?.addEventListener("change", refreshAll);

selHistMode?.addEventListener("change", () => {
  histMode = selHistMode.value;
  refreshHistograma();
});

window.addEventListener("resize", () => {
  chart1?.resize();
  chart2?.resize();
  chart3?.resize();
});

// 🔰 Inicial
refreshAll();
