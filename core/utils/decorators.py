# core/utils/decorators.py
from functools import wraps
from django.http import HttpResponse
from core.utils.weasy_compat import WEASY_AVAILABLE, WEASY_IMPORT_ERROR

def require_weasy(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not WEASY_AVAILABLE:
            return HttpResponse(
                "WeasyPrint no está disponible en este entorno (Cairo/Pango/GTK). "
                "En producción funciona normal. Para usar PDF en local, instala las dependencias nativas. "
                f"Detalle: {WEASY_IMPORT_ERROR}",
                status=500,
            )
        return view_func(request, *args, **kwargs)
    return _wrapped
