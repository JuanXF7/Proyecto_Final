# Generated migration for ListaDeseos model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('Tienda_Celulares', '0004_alter_perfilusuario_email'),
    ]

    operations = [
        migrations.CreateModel(
            name='ListaDeseos',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('productos', models.ManyToManyField(related_name='en_listas_deseos', to='Tienda_Celulares.producto')),
                ('usuario', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='lista_deseos', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
