from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, usuario, email, password=None, **extra_fields):
        if not usuario:
            raise ValueError("Debe indicar un nombre de usuario")
        email = self.normalize_email(email)
        user = self.model(usuario=usuario, email=email, **extra_fields)
        user.set_password(password)  # guarda hash compatible con Django en password_hash
        user.save(using=self._db)
        return user

    def create_superuser(self, usuario, email, password=None, **extra_fields):
        extra_fields.setdefault("rol", "ADMIN")
        extra_fields.setdefault("activo", True)
        return self.create_user(usuario, email, password, **extra_fields)

class Usuario(AbstractBaseUser):
    class Meta:
        db_table = "usuarios"
        managed = False  # ¡No dejar que Django cree/modifique esta tabla!

    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=80)
    apellidos = models.CharField(max_length=80)
    email = models.EmailField(unique=True)
    sede_id = models.BigIntegerField(null=True)
    rol = models.CharField(max_length=10)
    usuario = models.CharField(max_length=50, unique=True)

    # Django espera 'password' como atributo. Lo mapeamos a tu columna 'password_hash'
    password = models.CharField(max_length=255, db_column="password_hash")

    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField()

    # Requerido por AbstractBaseUser
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "usuario"
    REQUIRED_FIELDS = ["email"]

    objects = UsuarioManager()

    def __str__(self):
        return f"{self.usuario} ({self.rol})"

    @property
    def is_active(self):
        return self.activo

    @property
    def is_staff(self):
        return self.rol in ("RECTOR", "ADMIN")
