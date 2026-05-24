import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
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
        <button
          *ngIf="!loggedIn"
          class="btn-secondary"
          type="button"
          (click)="login.emit()"
        >
          <span class="btn-icon">🔐</span>
          Iniciar sesión
        </button>
        <button
          *ngIf="loggedIn"
          class="avatar-container"
          type="button"
          (click)="account.emit()"
          [attr.aria-label]="username ? 'Abrir panel de ' + username : 'Abrir panel de usuario'"
        >
          <img *ngIf="userAvatar" [src]="userAvatar" alt="Avatar" class="avatar-circle" />
          <span *ngIf="!userAvatar" class="avatar-circle avatar-icon">👤</span>
        </button>
        <button class="btn-primary">Ofertas exclusivas</button>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Input() loggedIn = false;
  @Input() userAvatar?: string;
  @Input() username?: string;
  @Output() login = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() account = new EventEmitter<void>();
}
