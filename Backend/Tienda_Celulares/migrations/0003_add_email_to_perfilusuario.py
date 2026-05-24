from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Tienda_Celulares', '0002_add_nombre_nickname_perfil'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfilusuario',
            name='email',
            field=models.EmailField(blank=True, default=''),
            preserve_default=False,
        ),
    ]
