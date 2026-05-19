import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">
          <img src="assets/logo_TechCore.jpg" alt="TechCore logo" />
        </div>
        <div>
          <span>TechCore</span>
          <small>Componentes de PC y celulares</small>
        </div>
      </div>

      <div class="top-actions">
        <div class="search-box">
          <input
            type="search"
            placeholder="Buscar celular, marca o modelo"
            aria-label="Buscar productos"
          />
          <button>Buscar</button>
        </div>
        <button class="btn-primary">Ofertas exclusivas</button>
      </div>
    </header>
  `
})
export class HeaderComponent {}
