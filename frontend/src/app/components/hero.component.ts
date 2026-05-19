import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Hub de celulares</span>
        <h1>Descubre los mejores smartphones con un diseño claro y profesional.</h1>
        <p>
          Productos cargados desde PostgreSQL a través del CRUD de Django. Aquí
          ves la información real y las imágenes dinámicas.
        </p>
      </div>

      <div class="hero-stats">
        <div class="hero-card">
          <span>Productos</span>
          <strong>{{ productCount }}</strong>
        </div>
        <div class="hero-card">
          <span>Base de datos</span>
          <strong>PostgreSQL</strong>
        </div>
        <div class="hero-card">
          <span>API</span>
          <strong>Django REST</strong>
        </div>
      </div>
    </section>
  `
})
export class HeroComponent {
  @Input() productCount = 0;
}
