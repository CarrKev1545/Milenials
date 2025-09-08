from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db import transaction

class Command(BaseCommand):
    help = "Crea/actualiza usuarios semilla: rector, docente, admin con sus roles."

    def add_arguments(self, parser):
        parser.add_argument("--rector-pass", required=True, help="Contraseña para el usuario 'rector'.")
        parser.add_argument("--docente-pass", required=True, help="Contraseña para el usuario 'docente'.")
        parser.add_argument("--admin-pass", required=True, help="Contraseña para el usuario 'admin'.")

    # ---------- utilidades ----------
    def _set_username(self, user, username):
        uname_field = getattr(user.__class__, "USERNAME_FIELD", None) or getattr(user, "USERNAME_FIELD", None)
        if not uname_field:
            for f in ("usuario", "username"):
                if hasattr(user, f):
                    uname_field = f
                    break
        if not uname_field:
            raise CommandError("No se pudo detectar USERNAME_FIELD (¿'usuario' o 'username'?).")
        setattr(user, uname_field, username)

    def _set_email_if_exists(self, user, email):
        if hasattr(user, "email"):
            user.email = email

    def _activar_si_existe(self, user):
        if hasattr(user, "activo"):
            user.activo = True

    def _set_password(self, user, raw_password):
        if hasattr(user, "set_password"):
            user.set_password(raw_password)
        else:
            if hasattr(user, "password"):
                user.password = make_password(raw_password)
            elif hasattr(user, "password_hash"):
                user.password_hash = make_password(raw_password)
            else:
                raise CommandError("El modelo no tiene set_password ni password/password_hash.")

    def _set_rol(self, user, rol_value):
        if not hasattr(user, "rol"):
            raise CommandError("El modelo de usuario no tiene campo 'rol'.")
        user.rol = rol_value

    def _fill_required_defaults(self, user, username):
        # nombre / apellidos básicos si existen y están vacíos
        if hasattr(user, "nombre") and not getattr(user, "nombre"):
            user.nombre = username.capitalize()
        if hasattr(user, "apellidos") and not getattr(user, "apellidos"):
            user.apellidos = "Sistema"

        # creado_en si existe y está vacío -> ahora
        if hasattr(user, "creado_en"):
            val = getattr(user, "creado_en", None)
            if not val:
                try:
                    user.creado_en = timezone.now()
                except Exception:
                    pass

    def _upsert_user(self, username, password, rol_value, email=None):
        User = get_user_model()
        uname_field = getattr(User, "USERNAME_FIELD", None) or "usuario"
        user = User.objects.filter(**{uname_field: username}).first()

        if user:
            self._set_rol(user, rol_value)
            self._activar_si_existe(user)
            self._set_password(user, password)
            if email:
                self._set_email_if_exists(user, email)
            self._fill_required_defaults(user, username)
            user.save(update_fields=None)
            self.stdout.write(self.style.SUCCESS(
                f"[bootstrap_usuarios] Usuario {username} actualizado (rol {rol_value})."
            ))
        else:
            user = User()
            self._set_username(user, username)
            self._set_rol(user, rol_value)
            self._activar_si_existe(user)
            if email:
                self._set_email_if_exists(user, email)
            self._fill_required_defaults(user, username)
            self._set_password(user, password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"[bootstrap_usuarios] Usuario {username} creado (rol {rol_value})."
            ))

    # ---------- handle ----------
    @transaction.atomic
    def handle(self, *args, **options):
        rector_pass = options["rector_pass"]
        docente_pass = options["docente_pass"]
        admin_pass  = options["admin_pass"]

        self._upsert_user("rector",  rector_pass,  "RECTOR",  email="rector@example.com")
        self._upsert_user("docente", docente_pass, "DOCENTE", email="docente@example.com")
        self._upsert_user("admin",   admin_pass,   "ADMIN",   email="admin@example.com")

        self.stdout.write(self.style.SUCCESS("Listo. Cuentas semilla creadas/actualizadas."))
