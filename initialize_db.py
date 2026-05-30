# initialize_db.py
import os
import sys
import sqlite3
import subprocess

def main():
    print("====================================================")
    print(" Iniciando Inicializador de Base de Datos SQLite")
    print("====================================================")

    db_path = "db.sqlite3"

    # 1. Borrar base de datos vieja si existe
    if os.path.exists(db_path):
        print(f"[-] Eliminando base de datos existente: {db_path}")
        try:
            os.remove(db_path)
        except Exception as e:
            print(f"[!] Error al eliminar {db_path}: {e}")
            print("[!] Por favor cierra cualquier programa que la esté usando y vuelve a intentar.")
            sys.exit(1)

    # 1.5. Limpiar migraciones viejas para asegurar que Django cree todas las tablas con managed=True
    print("[*] Limpiando archivos de migración viejos para regenerarlos...")
    import glob
    migrations_dir = os.path.join("core", "migrations")
    for f in glob.glob(os.path.join(migrations_dir, "*.py")):
        if not f.endswith("__init__.py"):
            try:
                os.remove(f)
            except Exception as e:
                print(f"[!] Advertencia al eliminar migración {f}: {e}")

    print("[*] Generando nuevas migraciones limpias...")
    subprocess.run([sys.executable, "manage.py", "makemigrations", "core"], check=True)

    # 2. Correr migraciones estándar de Django
    print("[*] Ejecutando migraciones estándar de Django...")
    subprocess.run([sys.executable, "manage.py", "migrate"], check=True)

    # 3. Conectarse a SQLite para crear tablas faltantes que no tienen modelos Django
    print("[*] Creando tablas requeridas por SQL nativo en SQLite...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Tabla grados
    cur.execute("""
    CREATE TABLE IF NOT EXISTS grados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL
    );
    """)

    # Tabla periodos
    cur.execute("""
    CREATE TABLE IF NOT EXISTS periodos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        abierto BOOLEAN DEFAULT 1,
        fecha_inicio DATE NOT NULL
    );
    """)

    # Tabla areas
    cur.execute("""
    CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL
    );
    """)

    # Tabla asignaturas
    cur.execute("""
    CREATE TABLE IF NOT EXISTS asignaturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        area_id INTEGER NOT NULL
    );
    """)

    # Tabla docentes
    cur.execute("""
    CREATE TABLE IF NOT EXISTS docentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL
    );
    """)

    # Tabla docente_grupo
    cur.execute("""
    CREATE TABLE IF NOT EXISTS docente_grupo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        docente_id INTEGER NOT NULL,
        grupo_id INTEGER NOT NULL
    );
    """)

    # Tabla grupo_asignatura
    cur.execute("""
    CREATE TABLE IF NOT EXISTS grupo_asignatura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grupo_id INTEGER NOT NULL,
        asignatura_id INTEGER NOT NULL
    );
    """)

    # Tabla docente_asignacion
    cur.execute("""
    CREATE TABLE IF NOT EXISTS docente_asignacion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        docente_id INTEGER NOT NULL,
        grupo_asignatura_id INTEGER NOT NULL
    );
    """)

    # Tabla docente_asignatura (para validación fallback)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS docente_asignatura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        docente_id INTEGER NOT NULL,
        grupo_id INTEGER NOT NULL,
        asignatura_id INTEGER NOT NULL
    );
    """)

    # Tabla notas_historial
    cur.execute("""
    CREATE TABLE IF NOT EXISTS notas_historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nota_id INTEGER,
        estudiante_id INTEGER,
        asignatura_id INTEGER,
        periodo_id INTEGER,
        nota_anterior DECIMAL(4,2),
        fallas_anterior INTEGER,
        nota_nueva DECIMAL(4,2),
        fallas_nuevas INTEGER,
        accion VARCHAR(20),
        realizado_por_usuario INTEGER,
        realizado_en TIMESTAMP
    );
    """)

    print("[+] Tablas creadas con éxito.")

    # 4. Insertar Datos de Prueba (Mock Data)
    print("[*] Población de datos iniciales en la base de datos...")

    # Sedes
    cur.execute("INSERT INTO sedes (id, nombre) VALUES (1, 'Sede Principal A')")
    cur.execute("INSERT INTO sedes (id, nombre) VALUES (2, 'Sede Campestre B')")

    # Grados
    cur.execute("INSERT INTO grados (id, nombre) VALUES (1, 'Sexto')")
    cur.execute("INSERT INTO grados (id, nombre) VALUES (2, 'Séptimo')")
    cur.execute("INSERT INTO grados (id, nombre) VALUES (3, 'Octavo')")

    # Grupos (Sede 1, Grado 1/2)
    cur.execute("INSERT INTO grupos (id, sede_id, grado_id, nombre) VALUES (1, 1, 1, '601-A')")
    cur.execute("INSERT INTO grupos (id, sede_id, grado_id, nombre) VALUES (2, 1, 1, '602-B')")
    cur.execute("INSERT INTO grupos (id, sede_id, grado_id, nombre) VALUES (3, 1, 2, '701-A')")

    # Estudiantes
    estudiantes_data = [
        (1, 'Juan Carlos', 'Pérez Gómez', '100101'),
        (2, 'María José', 'Rodríguez Silva', '100102'),
        (3, 'Andrés Felipe', 'Castro Vargas', '100103'),
        (4, 'Diana Marcela', 'Gutiérrez Ríos', '100104'),
        (5, 'Santiago', 'López Restrepo', '100105'),
        (6, 'Valentina', 'Torres Medina', '100106'),
    ]
    for est in estudiantes_data:
        cur.execute("INSERT INTO estudiantes (id, nombre, apellidos, documento, grupo_id) VALUES (?, ?, ?, ?, 1)", est)

    # Matrículas (EstudianteGrupo)
    for i in range(1, 7):
        cur.execute("INSERT INTO estudiante_grupo (id, estudiante_id, grupo_id, fecha_inicio) VALUES (?, ?, 1, '2026-01-15')", (i, i))

    # Periodos
    cur.execute("INSERT INTO periodos (id, nombre, abierto, fecha_inicio) VALUES (1, 'Primer Periodo (2026)', 1, '2026-01-20')")
    cur.execute("INSERT INTO periodos (id, nombre, abierto, fecha_inicio) VALUES (2, 'Segundo Periodo (2026)', 1, '2026-04-10')")

    # Areas
    cur.execute("INSERT INTO areas (id, nombre) VALUES (1, 'Matemáticas')")
    cur.execute("INSERT INTO areas (id, nombre) VALUES (2, 'Humanidades y Lengua Castellana')")

    # Asignaturas
    cur.execute("INSERT INTO asignaturas (id, nombre, area_id) VALUES (1, 'Álgebra', 1)")
    cur.execute("INSERT INTO asignaturas (id, nombre, area_id) VALUES (2, 'Geometría', 1)")
    cur.execute("INSERT INTO asignaturas (id, nombre, area_id) VALUES (3, 'Español', 2)")

    # GrupoAsignatura (Para Grupo 1 - 601-A)
    cur.execute("INSERT INTO grupo_asignatura (id, grupo_id, asignatura_id) VALUES (1, 1, 1)")
    cur.execute("INSERT INTO grupo_asignatura (id, grupo_id, asignatura_id) VALUES (2, 1, 2)")
    cur.execute("INSERT INTO grupo_asignatura (id, grupo_id, asignatura_id) VALUES (3, 1, 3)")

    # Guardamos y cerramos la conexión directa temporalmente para evitar el bloqueo del archivo en SQLite
    conn.commit()
    conn.close()

    # Crear Usuarios de Django (Rector, Docente, Admin) con passwords hasheadas correctamente
    print("[*] Configurando Django Settings para crear usuarios...")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    import django
    django.setup()
    
    from django.contrib.auth import get_user_model
    User = get_user_model()

    print("[*] Creando cuentas de usuario con Django Auth...")
    # Crear Rector
    rector_user, created = User.objects.get_or_create(
        usuario="rector",
        defaults={
            "nombre": "Carlos",
            "apellidos": "López Rector",
            "email": "rector@colegio.edu.co",
            "rol": "RECTOR",
            "activo": True,
            "creado_en": django.utils.timezone.now()
        }
    )
    rector_user.set_password("rector123")
    rector_user.save()

    # Crear Docente 1
    docente1_user, created = User.objects.get_or_create(
        usuario="docente1",
        defaults={
            "nombre": "Patricia",
            "apellidos": "Gómez Docente",
            "email": "docente1@colegio.edu.co",
            "rol": "DOCENTE",
            "activo": True,
            "creado_en": django.utils.timezone.now()
        }
    )
    docente1_user.set_password("docente123")
    docente1_user.save()

    # Crear Docente 2
    docente2_user, created = User.objects.get_or_create(
        usuario="docente2",
        defaults={
            "nombre": "Manuel",
            "apellidos": "Vargas Docente",
            "email": "docente2@colegio.edu.co",
            "rol": "DOCENTE",
            "activo": True,
            "creado_en": django.utils.timezone.now()
        }
    )
    docente2_user.set_password("docente123")
    docente2_user.save()

    # Crear Administrativo/Admin
    admin_user, created = User.objects.get_or_create(
        usuario="admin",
        defaults={
            "nombre": "Administrador",
            "apellidos": "General",
            "email": "admin@colegio.edu.co",
            "rol": "ADMIN",
            "activo": True,
            "creado_en": django.utils.timezone.now()
        }
    )
    admin_user.set_password("admin123")
    admin_user.save()

    # Reabrimos la conexión directa de SQLite para registrar los docentes y sus notas vinculadas
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Relacionar Docentes en tabla SQL docentes
    cur.execute("INSERT INTO docentes (id, usuario_id, nombre, apellidos) VALUES (1, ?, 'Patricia', 'Gómez')", (docente1_user.id,))
    cur.execute("INSERT INTO docentes (id, usuario_id, nombre, apellidos) VALUES (2, ?, 'Manuel', 'Vargas')", (docente2_user.id,))

    # Vincular Docente 1 al Grupo 1 (docente_grupo)
    cur.execute("INSERT INTO docente_grupo (docente_id, grupo_id) VALUES (1, 1)")
    # Vincular Docente 1 a las Asignaturas 1, 2, 3 en Grupo 1
    cur.execute("INSERT INTO docente_asignacion (docente_id, grupo_asignatura_id) VALUES (1, 1)") # Álgebra
    cur.execute("INSERT INTO docente_asignacion (docente_id, grupo_asignatura_id) VALUES (1, 2)") # Geometría
    cur.execute("INSERT INTO docente_asignacion (docente_id, grupo_asignatura_id) VALUES (1, 3)") # Español

    # Notas pre-existentes de prueba para los estudiantes
    # Estudiante 1 (Juan Carlos): Álgebra (4.2), Español (3.8)
    cur.execute("INSERT INTO notas (estudiante_id, asignatura_id, periodo_id, nota, fallas) VALUES (1, 1, 1, 4.20, 2)")
    cur.execute("INSERT INTO notas (estudiante_id, asignatura_id, periodo_id, nota, fallas) VALUES (1, 3, 1, 3.80, 0)")
    # Estudiante 2 (María José): Álgebra (2.5), Español (4.5)
    cur.execute("INSERT INTO notas (estudiante_id, asignatura_id, periodo_id, nota, fallas) VALUES (2, 1, 1, 2.50, 4)")
    cur.execute("INSERT INTO notas (estudiante_id, asignatura_id, periodo_id, nota, fallas) VALUES (2, 3, 1, 4.50, 1)")

    conn.commit()
    conn.close()

    print("\n====================================================")
    print(" ¡Base de datos inicializada y poblada con éxito!")
    print("====================================================")
    print("Cuentas listas para usar:")
    print(" -> Rector: usuario 'rector', clave 'rector123'")
    print(" -> Docente 1 (Dicta Matemáticas en 601-A): usuario 'docente1', clave 'docente123'")
    print(" -> Admin: usuario 'admin', clave 'admin123'")
    print("====================================================\n")

if __name__ == "__main__":
    main()
