# core/decorators.py
from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import redirect

def _es_docente(user):
    # Ajusta a tu lógica real:
    # 1) por grupo
    if user.is_authenticated and user.groups.filter(name__iexact="Docente").exists():
        return True
    # 2) o por campo perfil/rol (si lo tienes)
    return bool(user.is_authenticated and getattr(user, "rol", "").upper() == "DOCENTE")

def docente_required(view_func):
    return user_passes_test(_es_docente, login_url="login")(view_func)
