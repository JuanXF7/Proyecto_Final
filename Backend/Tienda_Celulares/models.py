from django.db import models
from django.contrib.auth.models import User

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


class Proveedor(models.Model):
    nombre = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    direccion = models.CharField(max_length=255)

    def __str__(self):
        return self.nombre
    
class LugarVenta(models.Model):
    nombre = models.CharField(max_length=150)
    direccion = models.CharField(max_length=255)
    ciudad = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    TIPOS = [
        ('PC', 'Componente PC'),
        ('CEL', 'Celular'),
        ('ACC', 'Accesorio'),
    ]

    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    marca = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPOS)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE)
    lugar_venta = models.ForeignKey(LugarVenta, on_delete=models.CASCADE)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class PerfilUsuario(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    email = models.EmailField(blank=True, default='')
    nombre = models.CharField(max_length=150, blank=True)
    nickname = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    ciudad = models.CharField(max_length=100)
    imagen = models.ImageField(upload_to='usuarios/', blank=True, null=True)

    def __str__(self):
        display_name = self.nickname or self.nombre or self.usuario.username
        return f'{display_name} ({self.usuario.username})'


class Pedido(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADO', 'Pagado'),
        ('ENVIADO', 'Enviado'),
        ('ENTREGADO', 'Entregado'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    entrega_estimada = models.DateField(blank=True, null=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f'Pedido {self.id}'


class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField()
    precio = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f'{self.producto.nombre} - {self.cantidad}'


class ListaDeseos(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='lista_deseos')
    productos = models.ManyToManyField(Producto, related_name='en_listas_deseos')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Lista de deseos de {self.usuario.username}'


class Review(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    comentario = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f'Review {self.rating} - {self.producto.nombre} by {self.usuario.username}'