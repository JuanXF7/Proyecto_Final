from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth import login
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db.models import Max
from django.utils import timezone
from datetime import timedelta
import random
from .models import *
from .serializers import *
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


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

    def get_queryset(self):
        return Producto.objects.filter(stock__gt=0)

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


@method_decorator(csrf_exempt, name='dispatch')
class RegisterUserView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Log the user in (create session)
        try:
            login(request, user)
        except Exception:
            pass

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
            'token': Token.objects.get_or_create(user=user)[0].key,
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
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

        # Create session
        try:
            login(request, user)
        except Exception:
            pass

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
            'token': Token.objects.get_or_create(user=user)[0].key,
        })


class PedidoViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Pedido.objects.all()
    serializer_class = PedidoSerializer

    def get_queryset(self):
        user = self.request.user
        return Pedido.objects.filter(usuario=user) if user and user.is_authenticated else Pedido.objects.none()

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def comprar(self, request):
        producto_id = request.data.get('producto_id')
        cantidad = request.data.get('cantidad')

        if not producto_id or cantidad is None:
            return Response({'detail': 'producto_id y cantidad son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cantidad = int(cantidad)
        except (TypeError, ValueError):
            return Response({'detail': 'Cantidad inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        if cantidad < 1:
            return Response({'detail': 'Cantidad inválida.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return Response({'detail': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if producto.stock < cantidad:
            return Response({'detail': 'No hay suficiente stock disponible.'}, status=status.HTTP_400_BAD_REQUEST)

        total = producto.precio * cantidad
        entrega_estimada = timezone.now().date() + timedelta(days=random.randint(1, 30))

        pedido = Pedido.objects.create(
            usuario=request.user,
            total=total,
            estado='ENVIADO',
            entrega_estimada=entrega_estimada,
        )
        DetallePedido.objects.create(
            pedido=pedido,
            producto=producto,
            cantidad=cantidad,
            precio=producto.precio,
        )

        producto.stock = max(producto.stock - cantidad, 0)
        producto.save()

        serializer = self.get_serializer(pedido)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def recibido(self, request, pk=None):
        try:
            pedido = Pedido.objects.get(id=pk, usuario=request.user)
        except Pedido.DoesNotExist:
            return Response({'detail': 'Pedido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        pedido.estado = 'ENTREGADO'
        pedido.save()
        serializer = self.get_serializer(pedido)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mis_compras(self, request):
        """Obtiene los pedidos del usuario logeado"""
        pedidos = Pedido.objects.filter(usuario=request.user)
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """Permite crear y listar reseñas de productos."""
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        producto = serializer.validated_data.get('producto') if 'producto' in serializer.validated_data else None
        # attach usuario automatically
        serializer.save(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        # Ensure user bought the product before allowing review
        producto_id = request.data.get('producto') or request.data.get('producto_id')
        if not producto_id:
            return Response({'detail': 'producto o producto_id requerido.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return Response({'detail': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Check purchase history
        has_bought = Pedido.objects.filter(usuario=request.user, detalles__producto=producto).exists()
        if not has_bought:
            return Response({'detail': 'Solo los usuarios que compraron el producto pueden valorarlo.'}, status=status.HTTP_403_FORBIDDEN)

        # Prevent duplicate reviews for the same user and product
        if Review.objects.filter(usuario=request.user, producto=producto).exists():
            return Response({'detail': 'Ya has calificado este producto.'}, status=status.HTTP_400_BAD_REQUEST)

        # Proceed to create review
        data = request.data.copy()
        data['producto'] = producto.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ListaDeseosViewSet(viewsets.ViewSet):
    """ViewSet para gestionar la lista de deseos"""
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Obtiene la lista de deseos del usuario logeado"""
        lista_deseos, _ = ListaDeseos.objects.get_or_create(usuario=request.user)
        serializer = ListaDeseosSerializer(lista_deseos)
        return Response(serializer.data)

    def create(self, request):
        """Agrega un producto a la lista de deseos"""
        lista_deseos, _ = ListaDeseos.objects.get_or_create(usuario=request.user)
        producto_id = request.data.get('producto_id')
        
        if not producto_id:
            return Response({'detail': 'producto_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return Response({'detail': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        if lista_deseos.productos.filter(id=producto_id).exists():
            return Response({'detail': 'El producto ya está en la lista de deseos.'}, status=status.HTTP_400_BAD_REQUEST)
        
        lista_deseos.productos.add(producto)
        serializer = ListaDeseosSerializer(lista_deseos)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    def remove(self, request):
        """Elimina un producto de la lista de deseos"""
        lista_deseos, _ = ListaDeseos.objects.get_or_create(usuario=request.user)
        producto_id = request.data.get('producto_id')
        
        if not producto_id:
            return Response({'detail': 'producto_id es requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return Response({'detail': 'Producto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        lista_deseos.productos.remove(producto)
        serializer = ListaDeseosSerializer(lista_deseos)
        return Response(serializer.data)