import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from Tienda_Celulares.models import Producto, Pedido
from Tienda_Celulares.serializers import ProductoSerializer, PedidoSerializer, ReviewSerializer
print('Producto exists:', bool(Producto.objects.first()))
print('Pedido exists:', bool(Pedido.objects.first()))
if Producto.objects.first():
    p = Producto.objects.first()
    print('Producto fields', list(ProductoSerializer(p).data.keys()))
    print('Producto reviews sample', ProductoSerializer(p).data.get('reviews'))
if Pedido.objects.first():
    q = Pedido.objects.first()
    print('Pedido fields', list(PedidoSerializer(q).data.keys()))
