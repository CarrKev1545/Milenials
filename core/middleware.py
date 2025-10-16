# core/middleware.py
from django.utils.cache import patch_cache_control
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib import messages
from django.contrib import auth
from django.utils.deprecation import MiddlewareMixin
from .models import UserActiveSession

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

class SingleSessionEnforceMiddleware(MiddlewareMixin):
    """
    Si el usuario viene con un session_key distinto al registrado como 'único',
    lo sacamos inmediatamente.
    """
    def process_request(self, request):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return  # anónimo: no aplica

        skey = request.session.session_key
        if not skey:
            request.session.save()
            skey = request.session.session_key

        active = UserActiveSession.objects.filter(user=user).first()

        # Si no hay registro (caso raro: limpiaron tabla), registra este
        if not active:
            UserActiveSession.objects.update_or_create(
                user=user,
                defaults={"session_key": skey,
                          "user_agent": request.META.get("HTTP_USER_AGENT",""),
                          "ip": request.META.get("REMOTE_ADDR")}
            )
            return

        # Si la sesión actual NO es la registrada → cerrar ya
        if active.session_key != skey:
            auth.logout(request)
            messages.warning(
                request,
                "Tu sesión fue cerrada porque iniciaste sesión en otro dispositivo."
            )
            return redirect(reverse("login"))
        