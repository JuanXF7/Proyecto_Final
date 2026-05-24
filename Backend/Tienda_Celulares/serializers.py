from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


class LugarVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LugarVenta
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField(read_only=True)
    reviews = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Producto
        fields = '__all__'

    def get_average_rating(self, obj):
        reviews = getattr(obj, 'reviews', None)
        if reviews is None:
            reviews = obj.reviews.all()
        count = reviews.count()
        if count == 0:
            return None
        total = sum([r.rating for r in reviews])
        return round(total / count, 2)

    def get_reviews(self, obj):
        reviews = obj.reviews.all().order_by('-fecha')[:10]
        return ReviewSerializer(reviews, many=True).data


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilUsuario
        fields = '__all__'
        extra_kwargs = {
            'usuario': {'read_only': True},
        }


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    nombre = serializers.CharField(max_length=150, required=False, allow_blank=True)
    nickname = serializers.CharField(max_length=100, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)
    direccion = serializers.CharField(max_length=255, required=False, allow_blank=True)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)
    imagen = serializers.ImageField(required=False, allow_null=True)

    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Este nombre de usuario ya existe.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.pop('username', '')
        email = validated_data.pop('email')
        nombre = validated_data.pop('nombre', '')
        nickname = validated_data.pop('nickname', '')
        telefono = validated_data.pop('telefono', '')
        direccion = validated_data.pop('direccion', '')
        ciudad = validated_data.pop('ciudad', '')
        imagen = validated_data.pop('imagen', None)

        if not username:
            username = email.split('@')[0]

        user = User.objects.create_user(username=username, email=email, password=password)
        PerfilUsuario.objects.create(
            usuario=user,
            email=email,
            nombre=nombre,
            nickname=nickname,
            telefono=telefono,
            direccion=direccion,
            ciudad=ciudad,
            imagen=imagen,
        )
        # Crear lista de deseos para el usuario
        ListaDeseos.objects.create(usuario=user)
        return user


class ReviewSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'usuario', 'rating', 'comentario', 'fecha']
        read_only_fields = ['usuario', 'fecha']


class DetallePedidoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)

    class Meta:
        model = DetallePedido
        fields = '__all__'


class PedidoSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    detalles = DetallePedidoSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = '__all__'
        read_only_fields = ['usuario']


class ListaDeseosSerializer(serializers.ModelSerializer):
    productos = ProductoSerializer(many=True, read_only=True)
    productos_ids = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        write_only=True,
        many=True,
        source='productos'
    )

    class Meta:
        model = ListaDeseos
        fields = ['id', 'usuario', 'productos', 'productos_ids', 'fecha_creacion']
        read_only_fields = ['usuario', 'fecha_creacion']