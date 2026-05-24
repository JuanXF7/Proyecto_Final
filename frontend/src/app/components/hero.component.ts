import { Component, Input, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HeroFeature {
  icon: string;
  title: string;
  text: string;
}

interface HeroSlide {
  image: string;
  alt: string;
  title: string;
  description: string;
  features: HeroFeature[];
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Hub de celulares</span>
        <h1>{{ currentSlide().title }}</h1>
        <p>{{ currentSlide().description }}</p>

        <div class="hero-features">
          <div class="hero-feature" *ngFor="let feature of currentSlide().features">
            <div class="hero-feature-icon">{{ feature.icon }}</div>
            <div>
              <strong>{{ feature.title }}</strong>
              <span>{{ feature.text }}</span>
            </div>
          </div>
        </div>

        <div class="carousel-indicators">
          <button
            type="button"
            *ngFor="let slide of slides; let i = index"
            [class.active]="i === currentIndex()"
            (click)="goToSlide(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
      </div>

      <div class="hero-carousel">
        <img [src]="currentSlide().image" [alt]="currentSlide().alt" />
      </div>
    </section>
  `
})
export class HeroComponent implements OnInit, OnDestroy {
  @Input() productCount = 0;

  protected readonly slides: HeroSlide[] = [
    {
      image: 'assets/Carrusel1.png',
      alt: 'Componentes de computadores',
      title: 'Componentes de computadoras',
      description: 'Encuentra las mejores piezas para armar tu PC, aqui encontrara de todo para que armes la maquina de tus sueños.',
      features: [
        {
          icon: '💻',
          title: 'CPU potente',
          text: 'Procesadores ideales para edición, gaming y multitarea.'
        },
        {
          icon: '🧠',
          title: 'Memoria y placa madre',
          text: 'Compatibilidad y velocidad para todo tu sistema.'
        },
        {
          icon: '⚡',
          title: 'Fuente segura',
          text: 'Energía estable para proteger tu inversión.'
        }
      ]
    },
    {
      image: 'assets/Carrusel2.png',
      alt: 'Celulares modernos',
      title: 'Smartphones y celulares modernos',
      description: 'Los últimos modelos de celulares con batería duradera, cámaras potentes y diseño elegante.',
      features: [
        {
          icon: '📷',
          title: 'Cámaras premium',
          text: 'Fotos nítidas y videos claros en cualquier condición.'
        },
        {
          icon: '🔋',
          title: 'Batería duradera',
          text: 'Horas de uso continuo sin recargar.'
        },
        {
          icon: '📱',
          title: 'Pantallas AMOLED',
          text: 'Colores vivos y diseño ultrafino.'
        }
      ]
    },
    {
      image: 'assets/Carrusel3.png',
      alt: 'PC de escritorio',
      title: 'Soluciones completas para tu PC',
      description: 'Equipos de escritorio para trabajo y gaming con componentes certificados y garantía confiable.',
      features: [
        {
          icon: '🖥️',
          title: 'Desktop armado',
          text: 'Equipos listos para usarse con rendimiento optimizado.'
        },
        {
          icon: '🎮',
          title: 'Gaming estable',
          text: 'Hardware premium para partidas fluidas.'
        },
        {
          icon: '🛡️',
          title: 'Soporte técnico',
          text: 'Asistencia y garantía para tu PC completa.'
        }
      ]
    }
  ];

  protected readonly currentIndex = signal(0);
  protected readonly currentSlide = computed(() => this.slides[this.currentIndex()]);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startInterval();
  }

  ngOnDestroy() {
    this.clearInterval();
  }

  protected goToSlide(index: number) {
    this.currentIndex.set(index);
    this.restartInterval();
  }

  private startInterval() {
    this.intervalId = setInterval(() => {
      this.currentIndex.update((value) => (value + 1) % this.slides.length);
    }, 5000);
  }

  private clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private restartInterval() {
    this.clearInterval();
    this.startInterval();
  }
}
