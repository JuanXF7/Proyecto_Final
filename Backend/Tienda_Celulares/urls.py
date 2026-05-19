from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

router.register(r'categorias', CategoriaViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'lugares-venta', LugarVentaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'usuarios', PerfilUsuarioViewSet)
router.register(r'pedidos', PedidoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]