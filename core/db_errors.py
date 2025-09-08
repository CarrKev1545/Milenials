# core/db_errors.py
from django.db import IntegrityError
from psycopg2 import errors as pgerr

def map_db_error(exc: Exception) -> str:
    """
    Devuelve un mensaje legible según la constraint/trigger que haya fallado.
    Usa exc.orig (psycopg2) para identificar la clase y el texto.
    """
    # Fallback genérico
    default = "No se pudo guardar por una regla de datos. Revisa la información."

    if not isinstance(exc, IntegrityError):
        return default

    orig = getattr(exc, "orig", None)
    if orig is None:
        return default

    txt = str(orig)

    # ---- CHECK violations (reglas de negocio) ----
    if isinstance(orig, pgerr.CheckViolation):
        if "notas_nota_rango" in txt:
            return "La nota debe estar entre 1.00 y 5.00."
        if "notas_fallas_no_negativas" in txt:
            return "Las fallas no pueden ser negativas."
        if "periodos_fechas_ok" in txt:
            return "La fecha de inicio no puede ser mayor que la fecha de fin."
        if "estudiantes_documento_formato" in txt:
            return "Documento inválido: solo dígitos (5–20 caracteres)."
        if "usuarios_email_formato" in txt:
            return "Email inválido."
        # Trigger validación notas ↔ grupo/asignatura
        if "fn_validar_nota_estudiante_en_grupo" in txt or "trg_notas_valida_estudiante_en_grupo" in txt:
            return "No se puede registrar la nota: el estudiante no tiene un grupo activo o la asignatura no pertenece a ese grupo."

        # Trigger validación de docente_asignacion ↔ grupo
        if "fn_validar_docente_asignacion_sobre_grupo" in txt or "trg_docente_asignacion_valida_grupo" in txt:
            return "Asignación inválida: el docente no tiene ese grupo asociado."

    # ---- UNIQUE violations ----
    if isinstance(orig, pgerr.UniqueViolation):
        if "ux_estudiante_grupo_un_activo" in txt:
            return "El estudiante ya tiene un grupo activo."
        if "ux_periodos_un_abierto" in txt:
            return "Ya existe un periodo abierto. Cierra el actual antes de abrir otro."
        if "ux_docente_asignacion" in txt:
            return "Ese docente ya tiene esa asignatura en ese grupo."

    # ---- FK violations ----
    if isinstance(orig, pgerr.ForeignKeyViolation):
        return "Referencia inexistente (verifique estudiante, grupo, asignatura o período)."

    return default
