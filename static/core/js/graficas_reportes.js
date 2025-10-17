// graficas_reportes.js  — ADMIN / (compatible con RECTOR si GR_URLS apunta a sus APIs)
(function () {
  const $ = (s) => document.querySelector(s);

  // --- Selectores de filtros (algunos pueden no existir y el código lo tolera)
  const selSede      = $("#f-sede");
  const selGrado     = $("#f-grado");
  const selGrupo     = $("#f-grupo");
  const selPeriodo   = $("#f-periodo");   // opcional
  const selThreshold = $("#f-threshold"); // opcional

  // --- ECharts
  const ECH = window.echarts;
  if (!ECH) {
    console.warn("ECharts no encontrado. Revisa la inclusión del script en el template.");
  }

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
  const URLS = window.GR_URLS || {};
  const URL_API_SEDES   = URLS.api_sedes;
  const URL_API_GRADOS  = URLS.api_grados_por_sede;
  const URL_API_GRUPOS  = URLS.api_grupos_por_sede_grado;
  const URL_API_ACTIVOS = URLS.api_metrics_activos;       // /api/metrics/activos
  const URL_API_REPROB  = URLS.api_metrics_reprobados || "/api/metrics/reprobados";
  const URL_API_HISTO   = URLS.api_metrics_histograma || "/api/metrics/histograma";

  if (!URL_API_SEDES || !URL_API_GRADOS || !URL_API_GRUPOS || !URL_API_ACTIVOS) {
    console.warn("Faltan URLs en window.GR_URLS. Revisa el bloque extra_js del template.");
  }

  // --- Mapa id -> nombre de sede (backend de /metrics/activos y /metrics/histograma reciben nombre)
  const SEDE_NAME_BY_ID = {};

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
    const sede_id = selSede?.value || "";
    clearSelect(selGrado, "Todos los grados");
    clearSelect(selGrupo, "Todos los grupos");
    disable(selGrado, !sede_id);
    disable(selGrupo, true);

    if (!sede_id || !URL_API_GRADOS || !selGrado) return;

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
    const sede_id  = selSede?.value || "";
    const grado_id = selGrado?.value || "";
    clearSelect(selGrupo, "Todos los grupos");
    disable(selGrupo, !grado_id);

    if (!grado_id || !URL_API_GRUPOS || !selGrupo) return;

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

  // ---------- CHART: ACTIVOS POR SEDE ----------
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
    const sede_id  = selSede?.value || "";
    const grupo_id = selGrupo?.value || "";

    const params = new URLSearchParams();
    if (sede_id) {
      const sedeNombre = SEDE_NAME_BY_ID[sede_id] || selSede?.options[selSede.selectedIndex]?.text || "";
      if (sedeNombre) params.append("sede", sedeNombre);
    }
    if (grupo_id) params.append("grupo_id", grupo_id);

    try {
      const url   = URL_API_ACTIVOS + (params.toString() ? "?" + params.toString() : "");
      const data  = await fetchJSON(url);
      const series = data.series || [];
      const names  = series.map((s) => s.name);
      const values = series.map((s) => s.value);

      const chart = ensureChartActivos();
      if (!chart) return;

      chart.setOption({
        backgroundColor: "transparent",
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
      console.error("[activos] error:", e);
      const chart = ensureChartActivos();
      chart && chart.setOption({ title: { text: "No se pudo cargar", left: "center" } });
    }

    // tras dibujar activos, refrescamos reprobados con los mismos filtros
    refreshReprobados();
    // si hay histograma, también
    refreshHistograma();
  }

  // ---------- CHART: REPROBADOS POR ASIGNATURA ----------
  let chartReprob = null;
  function ensureChartReprob() {
    if (!ECH) return null;
    if (!chartReprob) {
      const el = document.getElementById("chart-reprobados");
      if (!el) return null;
      chartReprob = ECH.init(el, null, { renderer: "canvas" });
      window.addEventListener("resize", () => chartReprob && chartReprob.resize());
    }
    return chartReprob;
  }

  async function fetchReprobados(params) {
    const qs = new URLSearchParams();
    if (params?.sede)       qs.set("sede", params.sede);
    if (params?.grado_id)   qs.set("grado_id", params.grado_id);
    if (params?.grupo_id)   qs.set("grupo_id", params.grupo_id);
    if (params?.periodo_id) qs.set("periodo_id", params.periodo_id);
    if (params?.threshold)  qs.set("threshold", params.threshold);
    const r = await fetch(`${URL_API_REPROB}?${qs.toString()}`, { credentials: "same-origin" });
    if (!r.ok) throw new Error("Error reprobados");
    return r.json();
  }

  function renderReprobadosChart(data) {
    const chart = ensureChartReprob();
    if (!chart) return;

    const series = data.series || [];
    const names  = series.map((s) => s.name);
    const values = series.map((s) => s.value);

    chart.setOption({
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
    const el = document.getElementById("chart-reprobados");
    if (!el) return; // si la tarjeta no existe, salimos

    const chart = ensureChartReprob();
    chart && chart.showLoading("default", { text: "Cargando..." });

    try {
      const sede_id    = selSede?.value || "";
      const grado_id   = selGrado?.value || "";
      const grupo_id   = selGrupo?.value || "";
      const periodo_id = selPeriodo?.value || "";     // opcional
      const threshold  = selThreshold?.value || "3.0"; // opcional

      const sedeNombre = sede_id
        ? (SEDE_NAME_BY_ID[sede_id] || selSede?.options[selSede.selectedIndex]?.text || "")
        : "";

      const data = await fetchReprobados({
        sede: sedeNombre, grado_id, grupo_id, periodo_id, threshold,
      });
      renderReprobadosChart(data);
    } catch (err) {
      console.error("[reprobados] error:", err);
      renderReprobadosChart({ series: [] });
    } finally {
      chart && chart.hideLoading();
    }
  }

  // ---------- CHART: HISTOGRAMA DE NOTAS (opcional) ----------
  let chartHist = null;
  function ensureChartHist() {
    if (!ECH) return null;
    if (!chartHist) {
      const el = document.getElementById("chart-histograma-notas");
      if (!el) return null;
      chartHist = ECH.init(el, null, { renderer: "canvas" });
      window.addEventListener("resize", () => chartHist && chartHist.resize());
    }
    return chartHist;
  }

  async function refreshHistograma() {
    const el = document.getElementById("chart-histograma-notas");
    if (!el) return; // no hay histograma en esta vista

    const chart = ensureChartHist();
    chart && chart.showLoading("default", { text: "Cargando..." });

    try {
      const sede_id    = selSede?.value || "";
      const grupo_id   = selGrupo?.value || "";
      const periodo_id = selPeriodo?.value || ""; // opcional

      const sedeNombre = sede_id
        ? (SEDE_NAME_BY_ID[sede_id] || selSede?.options[selSede.selectedIndex]?.text || "")
        : "";

      const res = await fetch(`${URL_API_HISTO}?${new URLSearchParams({
        sede: sedeNombre, grupo_id, periodo_id
      })}`, { credentials: "same-origin" });

      if (!res.ok) throw new Error("Error histograma");
      const data = await res.json();

      const series = Array.isArray(data?.series) ? data.series : [];
      const labels = series.map((s) => s.name);
      const values = series.map((s) => s.value);

      const finalLabels = labels.length ? labels : ["1.0","1.5","2.0","2.5","3.0","3.5","4.0","4.5","5.0"];
      const finalValues = labels.length ? values : new Array(finalLabels.length).fill(0);

      chart.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 30, bottom: 40 },
        xAxis: { type: "category", data: finalLabels, name: "Nota" },
        yAxis: { type: "value", name: "Cantidad" },
        series: [
          { name: "Estudiantes", type: "bar", data: finalValues, itemStyle: { color: "#26A69A", borderRadius: [6,6,0,0] } }
        ],
      });
    } catch (err) {
      console.error("[histograma] error:", err);
    } finally {
      chart && chart.hideLoading();
    }
  }

  // ---------- Eventos de filtros ----------
  selSede  && selSede.addEventListener("change", async () => {
    await loadGrados();
    await loadGrupos();
    renderActivos();
  });
  selGrado && selGrado.addEventListener("change", async () => {
    await loadGrupos();
    renderActivos();
  });
  selGrupo   && selGrupo.addEventListener("change", renderActivos);
  selPeriodo && selPeriodo.addEventListener("change", () => { refreshReprobados(); refreshHistograma(); });
  selThreshold && selThreshold.addEventListener("change", refreshReprobados);

  // ---------- Init ----------
  (async function init() {
    await loadSedes();
    // Si en el futuro agregas periodos con /api/docente/periodos-abiertos, puedes cargarlo aquí.
    renderActivos(); // esto refresca reprobados e histograma detrás
  })();
})();

