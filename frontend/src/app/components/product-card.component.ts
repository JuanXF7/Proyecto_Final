import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  @Input() product!: Producto;
  @Input() imageUrl!: string;
}
