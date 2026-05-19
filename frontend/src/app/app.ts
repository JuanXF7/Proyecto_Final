import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from './components/header.component';
import { HeroComponent } from './components/hero.component';
import { FiltersComponent } from './components/filters.component';
import { ProductsComponent } from './components/products.component';
import { Producto } from './product.model';

interface FilterState {
  brand: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  promotionsOnly: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, HeroComponent, FiltersComponent, ProductsComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected readonly products = signal<Producto[]>([]);
  protected readonly loading = signal(true);
  protected readonly apiBase = 'http://127.0.0.1:8000';
  protected readonly defaultImage = 'https://via.placeholder.com/420x360?text=Sin+imagen';

  protected readonly brandFilter = signal('');
  protected readonly typeFilter = signal('');
  protected readonly promotionsOnly = signal(false);
  protected readonly priceRangeMin = 0;
  protected readonly priceRangeMax = 99999999;
  protected readonly priceMinFilter = signal(this.priceRangeMin);
  protected readonly priceMaxFilter = signal(this.priceRangeMax);

  protected readonly brands = computed(() => {
    const values = [...new Set(this.products().map((product) => product.marca).filter(Boolean))];
    return values.sort();
  });

  protected readonly types = computed(() => {
    const values = [...new Set(this.products().map((product) => product.tipo).filter(Boolean))];
    return values.sort();
  });

  protected readonly filteredProducts = computed(() => {
    const min = Math.min(this.priceMinFilter(), this.priceMaxFilter());
    const max = Math.max(this.priceMinFilter(), this.priceMaxFilter());

    return this.products().filter((product) => {
      const price = this.normalizePrice(product.precio);
      const matchesBrand = !this.brandFilter() || product.marca === this.brandFilter();
      const matchesType = !this.typeFilter() || product.tipo === this.typeFilter();
      const matchesPrice = price >= min && price <= max;
      const matchesPromotion = !this.promotionsOnly() || !!product.promocion;

      return matchesBrand && matchesType && matchesPrice && matchesPromotion;
    });
  });

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  protected onFiltersChange(filters: FilterState) {
    this.brandFilter.set(filters.brand);
    this.typeFilter.set(filters.type);
    this.promotionsOnly.set(filters.promotionsOnly);
    this.priceMinFilter.set(filters.minPrice);
    this.priceMaxFilter.set(filters.maxPrice);
  }

  protected getProductImage(product: Producto) {
    if (!product.imagen) {
      return this.defaultImage;
    }
    return product.imagen.startsWith('http')
      ? product.imagen
      : `${this.apiBase}${product.imagen}`;
  }

  private loadProducts() {
    this.http.get<Producto[]>(`${this.apiBase}/api/productos/`).subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      }
    });
  }

  private normalizePrice(price: string | number): number {
    if (typeof price === 'number') {
      return price;
    }
    const normalized = parseFloat(price.toString().replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(normalized) ? normalized : 0;
  }
}
