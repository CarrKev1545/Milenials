// static/core/js/graficas_reportes_admin.js
(function () {
  const $ = (s) => document.querySelector(s);

  // Selects
  const selSede  = $("#f-sede");
  const selGrado = $("#f-grado");
  const selGrupo = $("#f-grupo");

  // URLs inyectadas por plantilla
  const URLS = window.GR_URLS || {};
  const URL_SEDES   = URLS.api_sedes;
  const URL_GRADOS  = URLS.api_grados_por_sede;
  const URL_GRUPOS  = URLS.api_grupos_por_sede_grado;
  const URL_ACTIVOS = URLS.api_metrics_activos;
  const URL_REPROB  = URLS.api_metrics_reprobados;

  // Mapa para traducir id -> nombre de sede (el backend de “activos” espera nombre)
  const SEDE_NAME_BY_ID = Object.create(null);

  // Helpers
  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(res.status + " " + url);
    return res.json();
  }
  function setOptions(select, placeholder, items = [], valueKey = "id", labelKey = "nombre") {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(it => {
      const o = document.createElement("option");
      o.value = it[valueKey];
      o.textContent = it[labelKey];
      select.appendChild(o);
    });
  }
  function disable(el, on) { el.disabled = !!on; }

  // Carga filtros
  async function loadSedes() {
    try {
      const data = await fetchJSON(URL_SEDES);
      const sedes = (data.sedes || []).map(r => ({ id: r[0] ?? r.id, nombre: r[1] ?? r.nombre }));
      setOptions(selSede, "Todas las sedes", sedes);
      sedes.forEach(s => SEDE_NAME_BY_ID[String(s.id)] = s.nombre);
    } catch (e) { console.warn("No se pudieron cargar sedes", e); }
  }

  async function loadGrados() {
    const sede_id = selSede.value || "";
    setOptions(selGrado, "Todos los grados", []);
    setOptions(selGrupo, "Todos los grupos", []);
    disable(selGrado, !sede_id);
    disable(selGrupo, true);
    if (!sede_id) return;

    try {
      const data = await fetchJSON(`${URL_GRADOS}?sede_id=${encodeURIComponent(sede_id)}`);
      const grados = (data.grados || []).map(r => ({ id: r[0] ?? r.id, nombre: r[1] ?? r.nombre }));
      setOptions(selGrado, "Todos los grados", grados);
      disable(selGrado, false);
    } catch (e) { console.warn("No se pudieron cargar grados", e); }
  }

  async function loadGrupos() {
    const sede_id  = selSede.value || "";
    const grado_id = selGrado.value || "";
    setOptions(selGrupo, "Todos los grupos", []);
    disable(selGrupo, !grado_id);
    if (!grado_id) return;

    try {
      const data = await fetchJSON(`${URL_GRUPOS}?sede_id=${encodeURIComponent(sede_id)}&grado_id=${encodeURIComponent(grado_id)}`);
      // API devuelve [id, "Sede - Grado - Grupo"] -> usamos id y tomamos lo que hay después del último " - " como nombre corto
      const grupos = (data.grupos || []).map(r => {
        const id = r[0] ?? r.id;
        const label = r[1] ?? r.nombre;
        const nombre = (String(label).split(" - ").pop() || label);
        return { id, nombre };
      });
      setOptions(selGrupo, "Todos los grupos", grupos);
      disable(selGrupo, false);
    } catch (e) { console.warn("No se pudieron cargar grupos", e); }
  }

  // ===== ECharts =====
  const ECH = window.echarts;
  const chartActivos = ECH.init(document.getElementById("chart-activos-sede"));
  const chartReprob  = ECH.init(document.getElementById("chart-reprobados"));
  window.addEventListener("resize", () => {
    chartActivos.resize(); chartReprob.resize();
  });

  async function renderActivos() {
    chartActivos.showLoading();
    try {
      const sede_id  = selSede.value || "";
      const grupo_id = selGrupo.value || "";
      const sedeNombre = sede_id ? (SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "") : "";

      const qs = new URLSearchParams();
      if (sedeNombre) qs.set("sede", sedeNombre);
      if (grupo_id)   qs.set("grupo_id", grupo_id);

      const data = await fetchJSON(`${URL_ACTIVOS}?${qs.toString()}`);
      const series = data.series || [];
      const labels = series.map(s => s.name);
      const values = series.map(s => s.value);

      chartActivos.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 16, top: 24, bottom: 40 },
        xAxis: { type: "category", data: labels, axisLabel: { rotate: 10 } },
        yAxis: { type: "value" },
        series: [{
          name: "Activos",
          type: "bar",
          data: values,
          barMaxWidth: 36,
          itemStyle: { color: "#1E88E5", borderRadius: [6,6,0,0] } // azul como antes
        }]
      });
    } catch (e) {
      console.error(e);
      chartActivos.setOption({ title: { text: "No se pudo cargar", left: "center" } });
    } finally {
      chartActivos.hideLoading();
    }
  }

  async function renderReprobados() {
    chartReprob.showLoading();
    try {
      const sede_id  = selSede.value || "";
      const grado_id = selGrado.value || "";
      const grupo_id = selGrupo.value || "";
      const sedeNombre = sede_id ? (SEDE_NAME_BY_ID[sede_id] || selSede.options[selSede.selectedIndex]?.text || "") : "";

      const qs = new URLSearchParams();
      if (sedeNombre) qs.set("sede", sedeNombre);
      if (grado_id)   qs.set("grado_id", grado_id);
      if (grupo_id)   qs.set("grupo_id", grupo_id);

      const data = await fetchJSON(`${URL_REPROB}?${qs.toString()}`);
      const series = data.series || [];
      const labels = series.map(s => s.name);
      const values = series.map(s => s.value);

      chartReprob.setOption({
        backgroundColor: "transparent",
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 30, bottom: 50 },
        xAxis: { type: "category", data: labels, axisLabel: { rotate: 20 } },
        yAxis: { type: "value", name: "Estudiantes" },
        series: [{
          name: "Reprobados",
          type: "bar",
          data: values,
          barWidth: "60%",
          itemStyle: { color: "#e53935", borderRadius: [6,6,0,0] } // rojo como antes
        }]
      });
    } catch (e) {
      console.error(e);
      chartReprob.setOption({ title: { text: "No se pudo cargar", left: "center" } });
    } finally {
      chartReprob.hideLoading();
    }
  }

  // Eventos de filtros
  selSede.addEventListener("change", async () => {
    await loadGrados();
    await loadGrupos();
    await renderActivos();
    await renderReprobados();
  });
  selGrado.addEventListener("change", async () => {
    await loadGrupos();
    await renderActivos();
    await renderReprobados();
  });
  selGrupo.addEventListener("change", async () => {
    await renderActivos();
    await renderReprobados();
  });

  // Init
  (async function init(){
    await loadSedes();
    await renderActivos();
    await renderReprobados();
  })();
})();
