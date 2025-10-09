# core/middleware.py
from django.utils.cache import patch_cache_control

class NoCacheForAuthenticatedHTMLMiddleware:
    """
    Evita que las vistas HTML servidas a usuarios autenticados se almacenen en caché.
    Resultado: al cerrar sesión y presionar 'Atrás', el navegador no mostrará páginas protegidas.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Solo aplica a HTML y SOLO cuando el usuario está autenticado.
        ctype = response.get('Content-Type', '')
        if request.user.is_authenticated and ctype and ctype.startswith('text/html'):
            patch_cache_control(
                response,
                no_cache=True,
                no_store=True,
                must_revalidate=True,
                max_age=0,
            )
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        return response
