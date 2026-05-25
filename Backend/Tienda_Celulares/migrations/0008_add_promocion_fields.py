from django.db import migrations, models
import django.core.validators

class Migration(migrations.Migration):

    dependencies = [
        ('Tienda_Celulares', '0007_review'),
    ]

    operations = [
        migrations.AddField(
            model_name='producto',
            name='descuento',
            field=models.PositiveIntegerField(default=0, help_text='Porcentaje de descuento aplicado cuando el producto está en oferta.', validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.AddField(
            model_name='producto',
            name='promocion',
            field=models.BooleanField(default=False),
        ),
    ]
