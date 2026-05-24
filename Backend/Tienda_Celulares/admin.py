from django.contrib import admin
from .models import *

admin.site.register(Categoria)
admin.site.register(Proveedor)
admin.site.register(LugarVenta)
admin.site.register(Producto)

@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'email', 'nombre', 'nickname', 'telefono', 'ciudad')
    search_fields = ('usuario__username', 'email', 'nombre', 'nickname', 'telefono', 'ciudad')

admin.site.register(Pedido)
admin.site.register(DetallePedido)