import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent {
  @Input() product!: Producto;
  @Input() imageUrl!: string;
  @Output() viewProduct = new EventEmitter<Producto>();

  getDiscountedPrice(product: Producto) {
    const price = typeof product.precio === 'string' ? parseFloat(product.precio) : Number(product.precio);
    if (product.promocion && product.descuento && product.descuento > 0) {
      return price * (1 - product.descuento / 100);
    }
    return price;
  }
}
