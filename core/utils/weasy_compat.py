WEASY_AVAILABLE = False
WEASY_IMPORT_ERROR = None

try:
    from weasyprint import HTML, CSS  # Producción (nube): tiene libs nativas → OK
    WEASY_AVAILABLE = True
except Exception as _e:  # Entorno local Windows sin Cairo/Pango/GTK
    WEASY_AVAILABLE = False
    WEASY_IMPORT_ERROR = _e

    # Exporta nombres para no romper imports existentes,
    # pero si se usan, lanzan error explicativo (el server no cae).
    def HTML(*_args, **_kwargs):
        raise RuntimeError(
            f"WeasyPrint no está disponible en este entorno (faltan dependencias nativas). Detalle: {WEASY_IMPORT_ERROR}"
        )

    def CSS(*_args, **_kwargs):
        raise RuntimeError(
            f"WeasyPrint no está disponible en este entorno (faltan dependencias nativas). Detalle: {WEASY_IMPORT_ERROR}"
        )