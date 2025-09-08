from django.db import migrations, models

class Migration(migrations.Migration):
    # 🔹 Es la migración inicial de core
    initial = True

    dependencies = [
        # Sin dependencias, para que esté disponible antes que admin
    ]

    operations = [
        migrations.CreateModel(
            name='Usuario',
            fields=[
                # No necesitamos todos los campos aquí; basta declarar el modelo.
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
            ],
            options={
                'db_table': 'usuarios',
                'managed': False,   # 👈 NO crear ni modificar la tabla real
            },
        ),
    ]
