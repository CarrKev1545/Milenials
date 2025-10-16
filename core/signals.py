# core/signals.py
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.contrib.sessions.models import Session
from django.utils import timezone

@receiver(user_logged_in)
def kill_other_sessions(sender, user, request, **kwargs):
    """
    Cuando el usuario inicia sesión, borra cualquier otra sesión activa
    que pertenezca al mismo usuario (en otros navegadores/dispositivos).
    """
    # Asegura que la sesión actual tenga clave
    if not request.session.session_key:
        request.session.save()  # fuerza a crear session_key

    current_key = request.session.session_key
    now = timezone.now()

    # Busca todas las sesiones no expiradas
    qs = Session.objects.filter(expire_date__gte=now)

    for s in qs:
        if s.session_key == current_key:
            continue
        data = s.get_decoded()
        # _auth_user_id se guarda como string en la sesión
        if data.get("_auth_user_id") == str(user.pk):
            s.delete()   # ← invalida esa sesión (cierra en otros navegadores)

