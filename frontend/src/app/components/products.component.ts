import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from './product-card.component';
import { Producto } from '../product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <section class="products">
      <div class="products-header">
        <div>
          <span class="subtitle">Catálogo</span>
          <h2>Productos disponibles</h2>
        </div>
        <p>{{ products.length }} productos</p>
      </div>

      <div *ngIf="loading; else productGrid" class="loader">
        Cargando productos desde Django...
      </div>

      <ng-template #productGrid>
        <div class="product-grid">
          <app-product-card
            *ngFor="let product of products"
            [product]="product"
            [imageUrl]="getProductImage(product)"
          ></app-product-card>
        </div>
      </ng-template>
    </section>
  `
})
export class ProductsComponent {
  @Input() products: Producto[] = [];
  @Input() loading = true;
  @Input() apiBase = '';
  @Input() defaultImage = '';

  getProductImage(product: Producto) {
    if (!product.imagen) {
      return this.defaultImage;
    }
    return product.imagen.startsWith('http')
      ? product.imagen
      : `${this.apiBase}${product.imagen}`;
  }
}
