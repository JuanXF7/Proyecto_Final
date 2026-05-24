import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProductFilters {
  brand: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  promotionsOnly: boolean;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="filters">
      <h2>Filtrar por</h2>
      <p>Encuentra rápido por marca, tipo, precio y promociones.</p>

      <div class="filter-group filter-row">
        <label>
          Marca
          <select [value]="selectedBrand" (change)="onFilterChange('brand', $any($event.target).value)">
            <option value="">Todas</option>
            <option *ngFor="let brand of brands" [value]="brand">{{ brand }}</option>
          </select>
        </label>

        <label>
          Tipo
          <select [value]="selectedType" (change)="onFilterChange('type', $any($event.target).value)">
            <option value="">Todos</option>
            <option *ngFor="let type of types" [value]="type">{{ type }}</option>
          </select>
        </label>
      </div>

      <div class="filter-group">
        <label class="filter-label">
          Precio mínimo
          <div class="price-input-row">
            <input
              type="range"
              [min]="minPrice"
              [max]="maxPrice"
              [value]="selectedMinPrice"
              (input)="onFilterChange('minPrice', $any($event.target).valueAsNumber)"
            />
            <input
              type="number"
              [min]="minPrice"
              [max]="maxPrice"
              [value]="selectedMinPrice"
              (input)="onFilterChange('minPrice', $any($event.target).valueAsNumber)"
            />
          </div>
          <span>{{ selectedMinPrice | number:'1.0-0' }}</span>
        </label>

        <label class="filter-label">
          Precio máximo
          <div class="price-input-row">
            <input
              type="range"
              [min]="minPrice"
              [max]="maxPrice"
              [value]="selectedMaxPrice"
              (input)="onFilterChange('maxPrice', $any($event.target).valueAsNumber)"
            />
            <input
              type="number"
              [min]="minPrice"
              [max]="maxPrice"
              [value]="selectedMaxPrice"
              (input)="onFilterChange('maxPrice', $any($event.target).valueAsNumber)"
            />
          </div>
          <span>{{ selectedMaxPrice | number:'1.0-0' }}</span>
        </label>

        <button type="button" class="clear-filters" (click)="resetFilters()">
          Limpiar filtros
        </button>
      </div>

      <div class="filter-group filter-checkbox">
        <label>
          <input
            type="checkbox"
            [checked]="promotionsOnly"
            (change)="onFilterChange('promotionsOnly', $any($event.target).checked)"
          />
          Solo promociones
        </label>
      </div>
    </aside>
  `
})
export class FiltersComponent {
  @Input() brands: string[] = [];
  @Input() types: string[] = [];
  @Input() minPrice = 0;
  @Input() maxPrice = 99999999;
  @Input() selectedBrand = '';
  @Input() selectedType = '';
  @Input() selectedMinPrice = 0;
  @Input() selectedMaxPrice = 99999999;
  @Input() promotionsOnly = false;

  @Output() filtersChange = new EventEmitter<ProductFilters>();

  protected resetFilters() {
    this.filtersChange.emit({
      brand: '',
      type: '',
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      promotionsOnly: false
    });
  }

  protected onFilterChange(field: keyof ProductFilters, value: string | number | boolean) {
    const filters: ProductFilters = {
      brand: this.selectedBrand,
      type: this.selectedType,
      minPrice: this.selectedMinPrice,
      maxPrice: this.selectedMaxPrice,
      promotionsOnly: this.promotionsOnly
    };

    if (field === 'brand') {
      filters.brand = value as string;
    } else if (field === 'type') {
      filters.type = value as string;
    } else if (field === 'minPrice') {
      filters.minPrice = value as number;
      if (filters.minPrice > filters.maxPrice) {
        filters.maxPrice = filters.minPrice;
      }
    } else if (field === 'maxPrice') {
      filters.maxPrice = value as number;
      if (filters.maxPrice < filters.minPrice) {
        filters.minPrice = filters.maxPrice;
      }
    } else if (field === 'promotionsOnly') {
      filters.promotionsOnly = value as boolean;
    }

    this.filtersChange.emit(filters);
  }
}
