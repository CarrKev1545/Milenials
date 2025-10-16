from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.conf import settings
from django.contrib.sessions.models import Session

class UsuarioManager(BaseUserManager):
    def create_user(self, usuario, email, password=None, **extra_fields):
        if not usuario:
            raise ValueError("Debe indicar un nombre de usuario")
        email = self.normalize_email(email)
        user = self.model(usuario=usuario, email=email, **extra_fields)
        # Guarda hash compatible con Django en la columna 'password_hash'
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, usuario, email, password=None, **extra_fields):
        extra_fields.setdefault("rol", "ADMIN")
        extra_fields.setdefault("activo", True)
        return self.create_user(usuario, email, password, **extra_fields)


class Usuario(AbstractBaseUser):
    class Meta:
        db_table = "usuarios"
        managed = False  # No permitir que Django cree/modifique esta tabla

    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=80)
    apellidos = models.CharField(max_length=80)
    email = models.EmailField(unique=True)
    sede_id = models.BigIntegerField(null=True)
    rol = models.CharField(max_length=10)
    usuario = models.CharField(max_length=50, unique=True)

    # Django espera 'password' como atributo. Mapeamos a la columna real 'password_hash'
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
        # Incluye al rol administrativo si quieres acceso al /admin de Django
        return self.rol in ("RECTOR", "ADMIN", "ADMINISTRATIVO")


class Grupo(models.Model):
    class Meta:
        db_table = "grupos"
        managed = False

    id = models.BigAutoField(primary_key=True)
    sede_id = models.BigIntegerField()
    grado_id = models.BigIntegerField()
    nombre = models.CharField(max_length=10)

    def __str__(self):
        return self.nombre


class Estudiante(models.Model):
    class Meta:
        db_table = "estudiantes"  # Nombre real de la tabla en BD
        managed = False           # Evita migraciones sobre esta tabla

    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    documento = models.CharField(max_length=20)
    grupo = models.ForeignKey(Grupo, related_name='estudiantes', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nombre} {self.apellidos}"


class ReporteAcademico(models.Model):
    """Modelo para generar reportes académicos de estudiantes por grupo.
       (Opcional en tu flujo actual; añade db_table si ya existe la tabla)"""

    class Meta:
        db_table = "reportes_academicos"  # Ajusta si tu tabla se llama distinto
        managed = False                   # Evita migraciones sobre esta tabla
        unique_together = ('grupo', 'estudiante', 'periodo')
        verbose_name = "Reporte Académico"
        verbose_name_plural = "Reportes Académicos"

    grupo = models.ForeignKey(Grupo, related_name='reportes', on_delete=models.CASCADE)
    estudiante = models.ForeignKey(Estudiante, related_name='reportes', on_delete=models.CASCADE)
    nota = models.DecimalField(max_digits=4, decimal_places=2)
    fallas = models.IntegerField(default=0)
    periodo = models.CharField(max_length=10)  # Puede ser ID o nombre del periodo

    def __str__(self):
        return f"Reporte de {self.estudiante} - {self.grupo.nombre} - {self.periodo}"
    
class EstudianteGrupo(models.Model):
    class Meta:
        db_table = "estudiante_grupo"
        managed = False

    id = models.BigAutoField(primary_key=True)
    estudiante = models.ForeignKey(
        Estudiante, db_column="estudiante_id",
        on_delete=models.DO_NOTHING, related_name="matriculas"
    )
    grupo = models.ForeignKey(
        Grupo, db_column="grupo_id",
        on_delete=models.DO_NOTHING, related_name="matriculas"
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    
# --- NUEVO: Sede ---
class Sede(models.Model):
    class Meta:
        db_table = "sedes"
        managed = False

    id = models.BigAutoField(primary_key=True)
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre
    
# =========================
# Modelo para tabla 'notas'
# =========================
class Nota(models.Model):
    class Meta:
        db_table = "notas"
        managed = False  # la tabla ya existe en tu BD

    id = models.BigAutoField(primary_key=True)
    estudiante_id = models.BigIntegerField()
    asignatura_id = models.BigIntegerField()
    periodo_id = models.BigIntegerField()
    nota = models.DecimalField(max_digits=4, decimal_places=2)
    fallas = models.IntegerField(default=0)

    def __str__(self):
        return f"Nota {self.nota} (estudiante_id={self.estudiante_id}, periodo_id={self.periodo_id})"

class UserActiveSession(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="active_session"
    )
    session_key = models.CharField(max_length=40, unique=True)
    user_agent = models.TextField(blank=True, default="")
    ip = models.GenericIPAddressField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id} -> {self.session_key}"