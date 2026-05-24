from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Tienda_Celulares', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfilusuario',
            name='nombre',
            field=models.CharField(blank=True, max_length=150, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='perfilusuario',
            name='nickname',
            field=models.CharField(blank=True, max_length=100, default=''),
            preserve_default=False,
        ),
    ]
