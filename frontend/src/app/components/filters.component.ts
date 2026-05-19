import { Component } from '@angular/core';

@Component({
  selector: 'app-filters',
  standalone: true,
  template: `
    <aside class="filters">
      <h2>Filtrar por</h2>
      <p>Encuentra rápido por categoría, marca y stock.</p>

      <div class="filter-group">
        <button>Marca</button>
        <button>Tipo</button>
        <button>Stock</button>
        <button>Promociones</button>
      </div>
    </aside>
  `
})
export class FiltersComponent {}
