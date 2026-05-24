import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from './product-card.component';
import { Producto } from '../product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  styleUrls: ['./products.component.css'],
  template: `
    <section class="products">
      <div class="products-header">
        <div>
          <span class="subtitle">Catálogo</span>
          <h2>Productos disponibles</h2>
        </div>
        <p>{{ totalProducts }} productos</p>
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
            (viewProduct)="viewProduct.emit($event)"
          ></app-product-card>
        </div>

        <div *ngIf="totalPages > 1" class="pagination">
          <button type="button" (click)="changePage(-1)" [disabled]="currentPage <= 1">
            Anterior
          </button>

          <button
            *ngFor="let page of pages"
            type="button"
            [class.active]="page === currentPage"
            (click)="setPage(page)"
          >
            {{ page }}
          </button>

          <button type="button" (click)="changePage(1)" [disabled]="currentPage >= totalPages">
            Siguiente
          </button>
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
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalProducts = 0;
  @Output() pageChange = new EventEmitter<number>();
  @Output() viewProduct = new EventEmitter<Producto>();

  get pages() {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  changePage(delta: number) {
    const nextPage = this.currentPage + delta;
    if (nextPage >= 1 && nextPage <= this.totalPages) {
      this.pageChange.emit(nextPage);
    }
  }

  setPage(page: number) {
    if (page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  getProductImage(product: Producto) {
    if (!product.imagen) {
      return this.defaultImage;
    }
    return product.imagen.startsWith('http')
      ? product.imagen
      : `${this.apiBase}${product.imagen}`;
  }
}
