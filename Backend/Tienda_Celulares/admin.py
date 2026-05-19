from django.contrib import admin
from .models import *

admin.site.register(Categoria)
admin.site.register(Proveedor)
admin.site.register(LugarVenta)
admin.site.register(Producto)
admin.site.register(PerfilUsuario)
admin.site.register(Pedido)
admin.site.register(DetallePedido)