// graficas_reportes.js  (ADMIN)
(function () {
  const $ = (s) => document.querySelector(s);

  // --- Selectores
  const selSede   = $("#f-sede");
  const selGrado  = $("#f-grado");
  const selGrupo  = $("#f-grupo");
  const selPeriodo   = $("#f-periodo");   // opcional (si no existe, no pasa nada)
  const selThreshold = $("#f-threshold"); // opcional

  // --- Utilidades
  async function fetchJSON(url) {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }
  function clearSelect(sel, ph) {
    if (!sel) return;
    sel.innerHTML = `<option value="">${ph}</option>`;
  }
  function enable(sel, on=true){ if(sel){ sel.disabled = !on; } }

  // --- URLs inyectadas desde el template
  const URLS = (typeof window !== "undefined" && window.GR_URLS) || {};
  const URL_API_SEDES  = URLS.api_sedes;
  const URL_API_GRADOS = URLS.api_grados_por_sede;
  const URL_API_GRUPOS = URLS.api_grupos_por_sede_grado;
  const URL_API_ACTIVOS = URLS.api_metrics_activos;
  const URL_API_REPROB  = "/api/metrics/reprobados"; // común
  const URL_API_HIST    = URLS.api_metrics_histograma || "/api/metrics/histograma";

  if (!URL_API_SEDES || !URL_API_GRADOS || !URL_API_GRUPOS || !URL_API_ACTIVOS) {
    console.warn("Faltan URLs en window.GR_URLS. Revisa el bloque extra_js del template.");
  }

  // --- Mapa id -> nombre de sede (el backend de 'activos' espera nombre)
  const SEDE_NAME_BY_ID = Object.create(null);

  // ---------- CARGA DE FILTROS ----------
  async function loadSedes() {
    clearSelect(selSede, "Todas las sedes");
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

  // ADMIN: grados SIEMPRE habilitado y cargan todos si sede=''
  async function loadGrados() {
    const sede_id = selSede?.value || "";
    clearSelect(selGrado, "Todos los grados");
    enable(selGrado, true);

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

  // ADMIN: grupos si hay sede O grado (si ambos vacíos, no cargamos para no traer todo)
  async function loadGrupos() {
    const sede_id  = selSede?.value || "";
    const grado_id = selGrado?.value || "";
    clearSelect(selGrupo, "Todos los grupos");

    if (!sede_id && !grado_id) { enable(selGrupo, false); return; }
    enable(selGrupo, true);

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

  // Periodos (si existe el select; si no, lo ignoramos)
  async function loadPeriodos() {
    if (!selPeriodo) return;
    clearSelect(selPeriodo, "Todos los periodos");

    try {
      const res = await fetch("/api/docente/periodos-abiertos", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        (data.periodos || []).forEach((p) => {
          const o = document.createElement("option");
          o.value = p.id;
          o.textContent = p.nombre;
          selPeriodo.appendChild(o);
        });
        return;
      }
    } catch(e){ /* fallback */ }

    [1,2,3,4].forEach(pid=>{
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
    if (sede_id) {
      const sedeNombre = SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "";
      if (sedeNombre) params.append("sede", sedeNombre);
    }
    if (grupo_id) params.append("grupo_id", grupo_id);

    try {
      const url = URL_API_ACTIVOS + (params.toString() ? "?" + params.toString() : "");
      const data = await fetchJSON(url);
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
            itemStyle: { color: "#3b82f6", borderRadius: [6, 6, 0, 0] }, // AZUL
          },
        ],
      });
    } catch (e) {
      console.error(e);
      const chart = ensureChartActivos();
      chart && chart.setOption({ title: { text: "No se pudo cargar", left: "center" } });
    }

    // Al cambiar activos, refrescamos también reprobados
    refreshReprobados();
  }

  // ---------- GRÁFICO: REPROBADOS POR ASIGNATURA ----------
  const elChartReprob = document.getElementById("chart-reprobados");
  let chartReprob = ECH && elChartReprob ? ECH.init(elChartReprob) : null;

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
    if (!chartReprob) return;
    const series = data.series || [];
    const names  = series.map((s) => s.name);
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
          itemStyle: { color: "#ef4444", borderRadius: [6, 6, 0, 0] }, // ROJO
        },
      ],
    });
  }

  async function refreshReprobados() {
    if (!chartReprob) return;
    chartReprob.showLoading("default", { text: "Cargando..." });
    try {
      const sede_id   = selSede?.value || "";
      const grado_id  = selGrado?.value || "";
      const grupo_id  = selGrupo?.value || "";
      const periodo_id = selPeriodo?.value || "";
      const threshold  = selThreshold?.value || "3.0";

      const sedeNombre = sede_id
        ? (SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "")
        : "";

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

  // ---------- HISTOGRAMA (si existe en la página) ----------
  (function () {
    const el = document.getElementById("chart-histograma-notas");
    if (!ECH || !el) return;

    const chart = ECH.init(el, null, { renderer: "canvas" });
    window.addEventListener("resize", () => chart.resize());

    async function fetchJSON2(url, params={}) {
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
        const sedeNombre = sede_id ? (SEDE_NAME_BY_ID[sede_id] || selSede?.options[selSede.selectedIndex]?.text || "") : "";

        const data = await fetchJSON2(URL_API_HIST, { sede: sedeNombre, grupo_id, periodo_id });
        const series = Array.isArray(data?.series) ? data.series : [];
        const labels = series.map((s) => s.name);
        const values = series.map((s) => s.value);

        chart.setOption({
          backgroundColor: "transparent",
          tooltip: { trigger: "axis" },
          grid: { left: 40, right: 20, top: 30, bottom: 40 },
          xAxis: { type: "category", data: labels, name: "Nota" },
          yAxis: { type: "value", name: "Cantidad" },
          series: [{
            name: "Estudiantes",
            type: "bar",
            data: values,
            itemStyle: { color: "#22c55e", borderRadius: [6,6,0,0] } // verde suave
          }]
        });
      } catch (err) {
        console.error(err);
        chart.setOption({ title: { text: "No se pudo cargar", left: "center" } });
      } finally {
        chart.hideLoading();
      }
    }

    // Enlazar a filtros
    selSede?.addEventListener("change", refresh);
    selGrado?.addEventListener("change", refresh);
    selGrupo?.addEventListener("change", refresh);
    selPeriodo?.addEventListener("change", refresh);

    refresh();
  })();

  // ---------- Eventos de filtros base ----------
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

  selPeriodo?.addEventListener("change", refreshReprobados);
  selThreshold?.addEventListener("change", refreshReprobados);

  // ---------- Init ----------
  (async function init() {
    await loadSedes();
    await loadGrados();   // 🔴 ahora siempre
    await loadGrupos();   // 🔴 por si ya hay sede o grado
    await loadPeriodos();
    renderActivos();      // también refresca reprobados
    if (chartReprob) {
      window.addEventListener("resize", () => chartReprob && chartReprob.resize());
    }
  })();
})();


