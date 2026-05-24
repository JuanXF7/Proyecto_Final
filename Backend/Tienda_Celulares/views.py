from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Max
from .models import *
from .serializers import *


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer


class LugarVentaViewSet(viewsets.ModelViewSet):
    queryset = LugarVenta.objects.all()
    serializer_class = LugarVentaSerializer


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    @action(detail=False, methods=['get'])
    def max_price(self, request):
        """Obtiene el precio máximo entre todos los productos"""
        max_price = Producto.objects.aggregate(Max('precio'))['precio__max']
        return Response({
            'max_price': float(max_price) if max_price else 0
        })


class PerfilUsuarioViewSet(viewsets.ModelViewSet):
    queryset = PerfilUsuario.objects.all()
    serializer_class = PerfilUsuarioSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class RegisterUserView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        perfil = PerfilUsuario.objects.filter(usuario=user).first()
        avatar_url = None
        if perfil and perfil.imagen:
            avatar_url = request.build_absolute_uri(perfil.imagen.url)

        return Response({
            'email': user.email,
            'nombre': perfil.nombre if perfil and perfil.nombre else user.username,
            'profileId': perfil.id if perfil else None,
            'nickname': perfil.nickname if perfil else '',
            'telefono': perfil.telefono if perfil else '',
            'direccion': perfil.direccion if perfil else '',
            'ciudad': perfil.ciudad if perfil else '',
            'avatarUrl': avatar_url,
        }, status=status.HTTP_201_CREATED)


class LoginUserView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Credenciales inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=user.username, password=password)
        if not user:
            return Response({'detail': 'Credenciales inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        perfil = PerfilUsuario.objects.filter(usuario=user).first()
        avatar_url = None
        if perfil and perfil.imagen:
            avatar_url = request.build_absolute_uri(perfil.imagen.url)

        return Response({
            'email': user.email,
            'nombre': perfil.nombre if perfil and perfil.nombre else user.username,
            'profileId': perfil.id if perfil else None,
            'nickname': perfil.nickname if perfil else '',
            'telefono': perfil.telefono if perfil else '',
            'direccion': perfil.direccion if perfil else '',
            'ciudad': perfil.ciudad if perfil else '',
            'avatarUrl': avatar_url,
        })


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer