from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

router.register(r'categorias', CategoriaViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'lugares-venta', LugarVentaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'usuarios', PerfilUsuarioViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'lista-deseos', ListaDeseosViewSet, basename='lista-deseos')

urlpatterns = [
    path('login/', LoginUserView.as_view(), name='login'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('', include(router.urls)),
]