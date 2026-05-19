import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from './components/header.component';
import { HeroComponent } from './components/hero.component';
import { FiltersComponent } from './components/filters.component';
import { ProductsComponent } from './components/products.component';
import { Producto } from './product.model';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
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
}
