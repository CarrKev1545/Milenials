# core/signals.py

from django.dispatch import receiver
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in, user_logged_out

from django.db import transaction

from .models import UserActiveSession
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


@receiver(user_logged_in)
def register_active_session(sender, user, request, **kwargs):
    # Asegura session_key
    if not request.session.session_key:
        request.session.save()
    skey = request.session.session_key

    # Registra/actualiza como la ÚNICA sesión del usuario
    with transaction.atomic():
        # Si otra sesión ya estaba registrada, la damos de baja
        prev = UserActiveSession.objects.filter(user=user).first()
        if prev and prev.session_key != skey:
            # borra también la sesión vieja en la tabla de sesiones
            Session.objects.filter(session_key=prev.session_key).delete()
        UserActiveSession.objects.update_or_create(
            user=user,
            defaults={
                "session_key": skey,
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
                "ip": request.META.get("REMOTE_ADDR"),
            },
        )

@receiver(user_logged_out)
def unregister_active_session(sender, user, request, **kwargs):
    if not user:
        return
    UserActiveSession.objects.filter(user=user).delete()
