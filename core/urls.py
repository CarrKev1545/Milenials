from django.urls import path
from . import views

urlpatterns = [
    # ===== Autenticación =====
    path("", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # ===== Dashboards =====
    path("dashboard/rector/", views.dashboard_rector, name="dashboard_rector"),
    path("dashboard/docente/", views.dashboard_docente, name="dashboard_docente"),
    path("dashboard/admin/", views.dashboard_admin, name="dashboard_admin"),

    # ===== Registro de estudiantes (página + creación JSON) =====
    path(
        "rector/registro-estudiantes/",
        views.rector_registro_estudiantes,
        name="rector_registro_estudiantes",
    ),
    path(
        "rector/registro-estudiantes/crear/",
        views.rector_registro_estudiantes_crear,
        name="rector_registro_estudiantes_crear",
    ),

    # ===== Menú superior (Rector) =====
    path(
        "rector/estudiantes-a-grupos/",
        views.rector_estudiantes_a_grupos,
        name="rector_estudiantes_a_grupos",
    ),
    path(
        "rector/estudiantes-a-grupos/asignar/",
        views.rector_estudiantes_a_grupos_asignar,
        name="rector_estudiantes_a_grupos_asignar",
    ),
    path(
        "rector/asignacion-docentes-grupos/",
        views.rector_asignacion_docentes_grupos,
        name="rector_asignacion_docentes_grupos",
    ),
    path(
        "rector/asignacion-docentes-grupos/asignar/",
        views.rector_asignacion_docentes_grupos_asignar,
        name="rector_asignacion_docentes_grupos_asignar",
    ),

    # ===== Registro de notas (filtro + variantes + tabla) =====
    path(
        "rector/registro-notas/",
        views.rector_registro_notas_filtro,
        name="rector_registro_notas",
    ),
    path(
        "rector/registro-notas/grupo/",
        views.rector_registro_notas_por_grupo,
        name="rector_registro_notas_por_grupo",
    ),
    path(
        "rector/registro-notas/estudiante/",
        views.rector_registro_notas_por_estudiante,
        name="rector_registro_notas_por_estudiante",
    ),
    path(
        "rector/registro-notas/resultados/",
        views.rector_reporte_notas_tabla,
        name="rector_reporte_notas_tabla",
    ),

    # ===== Reportes académicos (filtro + variantes + tabla) =====
    path(
        "rector/reportes-academicos/",
        views.rector_reportes_academicos_filtro,
        name="rector_reportes_academicos",
    ),
    path(
        "rector/reportes-academicos/grupo/",
        views.rector_reportes_academicos_por_grupo,
        name="rector_reportes_academicos_por_grupo",
    ),
    path(
        "rector/reportes-academicos/estudiante/",
        views.rector_reportes_academicos_por_estudiante,
        name="rector_reportes_academicos_por_estudiante",
    ),
    path(
        "rector/reportes-academicos/resultados/",
        views.rector_reportes_academicos_tabla,
        name="rector_reportes_academicos_tabla",
    ),

    # ===== Registrar/actualizar una nota (endpoint JSON) =====
    path(
        "rector/notas/registrar",
        views.rector_registrar_nota,
        name="rector_registrar_nota",
    ),

    # ===== APIs reales =====
    path(
        "api/estudiante/",
        views.api_estudiante_por_documento,
        name="api_estudiante_por_documento",
    ),
    path(
        "api/estudiante-en-grupo/",
        views.api_estudiante_en_grupo_por_documento,
        name="api_estudiante_en_grupo_por_documento",
    ),
    path("api/grados-por-sede/", views.api_grados_por_sede, name="api_grados_por_sede"),
    path(
        "api/grupos-por-sede-grado/",
        views.api_grupos_por_sede_grado,
        name="api_grupos_por_sede_grado",
    ),

    # ===== NUEVAS APIs para asignación de docentes =====
    path("api/docentes/", views.api_docentes, name="api_docentes"),
    path("api/grupos-por-docente/", views.api_grupos_por_docente, name="api_grupos_por_docente"),
    path("api/asignaturas-por-grupo/", views.api_asignaturas_por_grupo, name="api_asignaturas_por_grupo"),

    # ===== Asignación de docentes ↔ asignaturas (acciones rector) =====
    path(
        "rector/asignar-docente-asignatura/",
        views.rector_asignar_docente_asignatura,
        name="rector_asignar_docente_asignatura",
    ),
    path(
        "rector/quitar-docente-asignatura/",
        views.rector_quitar_docente_asignatura,
        name="rector_quitar_docente_asignatura",
    ),

    # ===== Filtros y datos para registro de notas (por grupo) =====
    path("api/sedes/", views.api_sedes, name="api_sedes"),
    path("api/periodos-abiertos/", views.api_periodos_abiertos, name="api_periodos_abiertos"),
    path("api/areas-por-grupo/", views.api_areas_por_grupo, name="api_areas_por_grupo"),
    path("api/asignaturas-por-grupo-area/", views.api_asignaturas_por_grupo_area, name="api_asignaturas_por_grupo_area"),
    path("api/estudiantes-por-grupo/", views.api_estudiantes_por_grupo, name="api_estudiantes_por_grupo"),
    path("api/docente-de-grupo-asignatura/", views.api_docente_de_grupo_asignatura, name="api_docente_de_grupo_asignatura"),

    # ===== Notas ya registradas (precarga) =====
    path(
        "api/notas-por-grupo-asignatura-periodo/",
        views.api_notas_por_grupo_asignatura_periodo,
        name="api_notas_por_grupo_asignatura_periodo",
    ),
    path(
        "api/notas-por-grupo/",
        views.api_notas_por_grupo_asignatura_periodo,
        name="api_notas_por_grupo",
    ),

    path("rector/vincular-docente-grupo", views.rector_vincular_docente_grupo,
         name="rector_vincular_docente_grupo"),

    # ===== Guardado y exportes =====
    path("rector/notas/guardar/", views.rector_notas_guardar, name="rector_notas_guardar"),
    path("rector/notas/export/excel/", views.export_notas_excel, name="export_notas_excel"),
    path("rector/notas/export/pdf/", views.export_notas_pdf, name="export_notas_pdf"),

    # ===== Reportes académicos (API) =====
    path("api/reporte-academico/grupo/", views.api_reporte_academico_grupo, name="api_reporte_academico_grupo"),
    path("api/reporte-academico/estudiante/", views.api_reporte_academico_estudiante, name="api_reporte_academico_estudiante"),

    # ===== Boletines (export) =====
    path(
        "reportes/export/",
        views.rector_reportes_academicos_export,
        name="rector_reportes_academicos_export",
    ),

    # ======== ALIAS PARA DOCENTE (redirigen con los parámetros correctos) ========
    path("reportes/boletin/grupo/pdf",        views.docente_boletin_grupo_pdf_alias,        name="docente_boletin_grupo_pdf_alias"),
    path("reportes/boletin/grupo/excel",      views.docente_boletin_grupo_excel_alias,      name="docente_boletin_grupo_excel_alias"),
    path("reportes/boletin/estudiante/pdf",   views.docente_boletin_estudiante_pdf_alias,   name="docente_boletin_estudiante_pdf_alias"),
    path("reportes/boletin/estudiante/excel", views.docente_boletin_estudiante_excel_alias, name="docente_boletin_estudiante_excel_alias"),

    # =======================================================================

    # ===== DOCENTE: Registro de notas =====
    path(
        "docente/registro-notas/",
        views.docente_registro_notas_filtro,
        name="docente_registro_notas_filtro",
    ),
    path(
        "docente/registro-notas/grupo/",
        views.docente_registro_notas_por_grupo,
        name="docente_registro_notas_por_grupo",
    ),
    path(
        "docente/notas/registrar",
        views.docente_registrar_nota,
        name="docente_registrar_nota",
    ),

    # ===== DOCENTE: Reportes académicos =====
    path(
        "docente/reportes-academicos/",
        views.docente_reportes_academicos_filtro,
        name="docente_reportes_academicos_filtro",
    ),
    path(
        "docente/reportes-academicos/grupo/",
        views.docente_reportes_academicos_por_grupo,
        name="docente_reportes_academicos_por_grupo",
    ),
    path(
        "docente/reportes/export/",
        views.docente_reportes_academicos_export,
        name="docente_reportes_academicos_export",
    ),

    

    # ===== APIs de filtros para DOCENTE =====
    path("api/docente/sedes", views.api_docente_sedes, name="api_docente_sedes"),
    path("api/docente/grados-por-sede", views.api_docente_grados_por_sede, name="api_docente_grados_por_sede"),
    path("api/docente/grupos-por-sede-grado", views.api_docente_grupos_por_sede_grado, name="api_docente_grupos_por_sede_grado"),
    path("api/docente/areas-por-grupo", views.api_docente_areas_por_grupo, name="api_docente_areas_por_grupo"),
    path("api/docente/asignaturas-por-grupo-area", views.api_docente_asignaturas_por_grupo_area, name="api_docente_asignaturas_por_grupo_area"),
    path("api/docente/periodos-abiertos", views.api_docente_periodos_abiertos, name="api_docente_periodos_abiertos"),

    # ✅ UNA sola vez:
    path("api/docente/estudiantes-por-grupo", views.api_docente_estudiantes_por_grupo, name="api_docente_estudiantes_por_grupo"),

    # ✅ Endpoint de notas:
    path("api/docente/notas-por-grupo-asignatura-periodo",
        views.api_docente_notas_por_grupo_asignatura_periodo,
        name="api_docente_notas_por_grupo_asignatura_periodo"),

    # ===== ADMINISTRATIVO: Reportes académicos (páginas HTML) =====
    path("administrativo/reportes-academicos/", views.administrativo_reportes_academicos_filtro, name="administrativo_reportes_academicos_filtro"),
    path("administrativo/reportes-academicos/grupo/", views.administrativo_reportes_academicos_por_grupo, name="administrativo_reportes_academicos_por_grupo"),
    path("administrativo/reportes-academicos/estudiante/", views.administrativo_reportes_academicos_por_estudiante, name="administrativo_reportes_academicos_por_estudiante"),  # opcional
    path("administrativo/reportes-academicos/tabla/", views.administrativo_reportes_academicos_tabla, name="administrativo_reportes_academicos_tabla"),  # opcional

    # ===== ADMINISTRATIVO: APIs de filtros (JSON) =====
    path("api/admin/sedes/", views.api_admin_sedes, name="api_admin_sedes"),
    path("api/admin/grados-por-sede/", views.api_admin_grados_por_sede, name="api_admin_grados_por_sede"),
    path("api/admin/grupos-por-sede-grado/", views.api_admin_grupos_por_sede_grado, name="api_admin_grupos_por_sede_grado"),
    path("api/admin/periodos-abiertos/", views.api_admin_periodos_abiertos, name="api_admin_periodos_abiertos"),
    path("api/admin/estudiantes-por-grupo/", views.api_admin_estudiantes_por_grupo, name="api_admin_estudiantes_por_grupo"),
]