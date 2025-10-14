# core/db_errors.py
"""
Mapeo de errores de base de datos compatible con psycopg v3 (psycopg)
y con psycopg2 si alguna vez se usa localmente.
"""

from typing import Optional

# Intentamos psycopg (v3) primero; si no, psycopg2; si no, None.
_pg_errors = None
try:
    from psycopg import errors as _pg_errors  # psycopg v3
    DRIVER = "psycopg3"
except Exception:
    try:
        from psycopg2 import errors as _pg_errors  # psycopg2
        DRIVER = "psycopg2"
    except Exception:
        DRIVER = None


def _get_sqlstate(exc: Exception) -> Optional[str]:
    """Obtiene SQLSTATE si está disponible (psycopg3: .sqlstate, psycopg2: .pgcode)."""
    for obj in (exc, getattr(exc, "__cause__", None), getattr(exc, "__context__", None)):
        if obj is None:
            continue
        code = getattr(obj, "sqlstate", None) or getattr(obj, "pgcode", None)
        if code:
            return str(code)
    return None


def map_db_error(exc: Exception) -> str:
    """
    Retorna una etiqueta corta:
      'unique'   -> violación de unicidad (23505)
      'fk'       -> violación de llave foránea (23503)
      'not_null' -> NOT NULL (23502)
      'check'    -> check constraint (23514)
      'other'    -> cualquier otro
    """
    # 1) Si tenemos clases de errores del driver, probamos por isinstance
    cause = getattr(exc, "__cause__", None)
    if _pg_errors and cause is not None:
        if isinstance(cause, getattr(_pg_errors, "UniqueViolation", tuple())):
            return "unique"
        if isinstance(cause, getattr(_pg_errors, "ForeignKeyViolation", tuple())):
            return "fk"
        if isinstance(cause, getattr(_pg_errors, "NotNullViolation", tuple())):
            return "not_null"
        if isinstance(cause, getattr(_pg_errors, "CheckViolation", tuple())):
            return "check"

    # 2) Fallback por SQLSTATE
    sqlstate = _get_sqlstate(exc)
    if sqlstate == "23505":
        return "unique"
    if sqlstate == "23503":
        return "fk"
    if sqlstate == "23502":
        return "not_null"
    if sqlstate == "23514":
        return "check"

    return "other"
