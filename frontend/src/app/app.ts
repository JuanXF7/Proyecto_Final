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
  protected readonly priceRangeMax = signal(99999999);
  protected readonly priceMinFilter = signal(this.priceRangeMin);
  protected readonly priceMaxFilter = signal(this.priceRangeMax());
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 8;
  protected readonly showLogin = signal(false);
  protected readonly loginMode = signal<'login' | 'register'>('login');
  protected readonly loginEmail = signal('');
  protected readonly loginPassword = signal('');
  protected readonly registerName = signal('');
  protected readonly registerUsername = signal('');
  protected readonly registerNickname = signal('');
  protected readonly registerEmail = signal('');
  protected readonly registerPassword = signal('');
  protected readonly registerConfirmPassword = signal('');
  protected readonly registerPhone = signal('');
  protected readonly registerCity = signal('');
  protected readonly registerAddress = signal('');
  protected readonly authMessage = signal('');
  protected readonly currentUser = signal<{ email: string; nombre: string; profileId?: number | null; avatarUrl?: string } | null>(null);
  protected readonly profileId = signal<number | null>(null);
  protected readonly profileEmail = signal('');
  protected readonly profileName = signal('');
  protected readonly profileNickname = signal('');
  protected readonly profilePhone = signal('');
  protected readonly profileAddress = signal('');
  protected readonly profileCity = signal('');
  protected readonly profileAvatarUrl = signal('');
  protected readonly profileAvatarPreview = signal('');
  protected readonly profileAvatarFile = signal<File | null>(null);
  protected readonly profileUpdateMessage = signal('');
  protected readonly profileSaving = signal(false);
  protected readonly currentView = signal<'home' | 'dashboard'>('home');
  protected readonly dashboardTab = signal<'compras' | 'deseos' | 'carrito' | 'cuenta'>('compras');
  protected readonly showModal = signal(false);
  protected readonly selectedProduct = signal<Producto | null>(null);
  protected readonly currentUserAvatar = computed(() => this.currentUser()?.avatarUrl ?? '');
  protected readonly currentUserName = computed(() => this.currentUser()?.nombre ?? this.currentUser()?.email ?? '');
  protected readonly isLoggedIn = computed(() => !!this.currentUser());
  protected readonly isDashboardActive = computed(() => this.currentView() === 'dashboard');
  protected readonly isHome = computed(() => !this.isDashboardActive());
  protected readonly isAuth = computed(() => false);

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

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize))
  );

  protected readonly pagedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMaxPrice();
    this.loadProducts();
  }

  protected onFiltersChange(filters: FilterState) {
    this.brandFilter.set(filters.brand);
    this.typeFilter.set(filters.type);
    this.promotionsOnly.set(filters.promotionsOnly);
    this.priceMinFilter.set(filters.minPrice);
    this.priceMaxFilter.set(filters.maxPrice);
    this.currentPage.set(1);
  }

  protected onPageChange(page: number) {
    this.currentPage.set(page);
  }

  protected updateBodyScroll() {
    const isModalOpen = this.showModal() || this.showLogin();
    document.body.classList.toggle('modal-open', isModalOpen);
  }

  protected openLoginModal() {
    this.loginMode.set('login');
    this.showLogin.set(true);
    this.authMessage.set('');
    this.updateBodyScroll();
  }

  protected closeLogin() {
    this.showLogin.set(false);
    this.authMessage.set('');
    this.updateBodyScroll();
  }

  protected setLoginMode(mode: 'login' | 'register') {
    this.loginMode.set(mode);
    this.authMessage.set('');
  }

  protected setCurrentUserProfile(data: {
    email: string;
    nombre: string;
    profileId?: number | null;
    avatarUrl?: string | null;
    nickname?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  }) {
    this.currentUser.set({
      email: data.email,
      nombre: data.nombre,
      profileId: data.profileId ?? null,
      avatarUrl: data.avatarUrl ?? undefined,
    });
    this.profileId.set(data.profileId ?? null);
    this.profileEmail.set(data.email);
    this.profileName.set(data.nombre);
    this.profileNickname.set(data.nickname ?? '');
    this.profilePhone.set(data.telefono ?? '');
    this.profileAddress.set(data.direccion ?? '');
    this.profileCity.set(data.ciudad ?? '');
    this.profileAvatarUrl.set(data.avatarUrl ?? '');
    this.profileAvatarPreview.set('');
    this.profileAvatarFile.set(null);
  }

  protected handleProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    if (!file) {
      this.profileAvatarFile.set(null);
      this.profileAvatarPreview.set('');
      return;
    }

    // Redimensionar/recortar el avatar a un tamaño cuadrado consistente antes de subir
    this.resizeImageFile(file, 40).then((resized) => {
      if (this.profileAvatarPreview()) {
        try { URL.revokeObjectURL(this.profileAvatarPreview()); } catch (e) {}
      }
      const previewUrl = URL.createObjectURL(resized);
      this.profileAvatarFile.set(resized);
      this.profileAvatarPreview.set(previewUrl);
    }).catch(() => {
      // En caso de error, usar el archivo original como respaldo
      if (this.profileAvatarPreview()) {
        try { URL.revokeObjectURL(this.profileAvatarPreview()); } catch (e) {}
      }
      const previewUrl = URL.createObjectURL(file);
      this.profileAvatarFile.set(file);
      this.profileAvatarPreview.set(previewUrl);
    });
  }

  private resizeImageFile(file: File, size: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result as string;
      };

      img.onerror = () => reject(new Error('Error loading image'));
      reader.onerror = () => reject(new Error('Error reading file'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));

          // Tamaño destino cuadrado
          const target = size;
          canvas.width = target;
          canvas.height = target;

          const iw = img.width;
          const ih = img.height;

          // Calcular recorte centrado tipo 'cover'
          const srcRatio = iw / ih;
          const destRatio = 1; // square

          let sx = 0, sy = 0, sw = iw, sh = ih;

          if (srcRatio > destRatio) {
            // imagen más apaisada -> recortar por los lados
            sw = Math.floor(ih * destRatio);
            sx = Math.floor((iw - sw) / 2);
          } else if (srcRatio < destRatio) {
            // imagen más alta -> recortar por arriba/abajo
            sh = Math.floor(iw / destRatio);
            sy = Math.floor((ih - sh) / 2);
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, target, target);

          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed to create blob'));
            const ext = file.type || 'image/jpeg';
            const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
            resolve(resizedFile);
          }, 'image/jpeg', 0.9);
        } catch (e) {
          reject(e);
        }
      };

      reader.readAsDataURL(file);
    });
  }

  protected handleProfileUpdate(event: Event) {
    event.preventDefault();
    this.profileUpdateMessage.set('');

    const profileId = this.profileId();
    if (!profileId) {
      this.profileUpdateMessage.set('No se encontró el perfil de usuario.');
      return;
    }

    this.profileSaving.set(true);
    const formData = new FormData();
    formData.append('email', this.profileEmail());
    formData.append('nombre', this.profileName());
    formData.append('nickname', this.profileNickname());
    formData.append('telefono', this.profilePhone());
    formData.append('direccion', this.profileAddress());
    formData.append('ciudad', this.profileCity());

    if (this.profileAvatarFile()) {
      formData.append('imagen', this.profileAvatarFile() as File);
    }

    this.http.put<{ id: number; email: string; nombre: string; nickname: string; telefono: string; direccion: string; ciudad: string; imagen?: string | null; }>(
      `${this.apiBase}/api/usuarios/${profileId}/`,
      formData
    ).subscribe({
      next: (data) => {
        const imagenValue = data.imagen || '';
        const avatarUrl = imagenValue
          ? (imagenValue.startsWith('http') ? imagenValue : `${this.apiBase}${imagenValue}`)
          : this.profileAvatarUrl();

        this.setCurrentUserProfile({
          email: data.email,
          nombre: data.nombre,
          profileId,
          nickname: data.nickname,
          telefono: data.telefono,
          direccion: data.direccion,
          ciudad: data.ciudad,
          avatarUrl,
        });
        this.profileUpdateMessage.set('Perfil actualizado correctamente.');
      },
      error: (err) => {
        const message = err?.error?.detail || 'Error al actualizar el perfil.';
        this.profileUpdateMessage.set(message);
      },
      complete: () => {
        this.profileSaving.set(false);
      }
    });
  }

  protected handleAuthSubmit(event: Event) {
    event.preventDefault();

    if (this.loginMode() === 'login') {
      const payload = {
        email: this.loginEmail(),
        password: this.loginPassword(),
      };

      this.http.post<{ email: string; nombre: string; profileId?: number; avatarUrl?: string; nickname?: string; telefono?: string; direccion?: string; ciudad?: string }>(
        `${this.apiBase}/api/login/`,
        payload
      ).subscribe({
        next: (data) => {
          this.setCurrentUserProfile({
            email: data.email,
            nombre: data.nombre,
            profileId: data.profileId,
            avatarUrl: data.avatarUrl,
            nickname: data.nickname,
            telefono: data.telefono,
            direccion: data.direccion,
            ciudad: data.ciudad,
          });
          this.authMessage.set('Acceso exitoso.');
          this.closeLogin();
          this.goToDashboard('compras');
        },
        error: (err) => {
          const message = err?.error?.detail || 'Credenciales inválidas.';
          this.authMessage.set(message);
        }
      });
      return;
    }

    const usernameValue = this.registerUsername().trim() || this.registerEmail().trim();
    if (!usernameValue) {
      this.authMessage.set('Debes ingresar un nombre de usuario o un correo válido.');
      return;
    }

    if (this.registerPassword() !== this.registerConfirmPassword()) {
      this.authMessage.set('Las contraseñas deben coincidir.');
      return;
    }

    const payload = {
      username: usernameValue,
      email: this.registerEmail(),
      password: this.registerPassword(),
      nombre: this.registerName(),
      nickname: this.registerNickname(),
      telefono: this.registerPhone(),
      direccion: this.registerAddress(),
      ciudad: this.registerCity(),
    };

    this.http.post<{ email?: string; nombre?: string; profileId?: number; avatarUrl?: string; nickname?: string; telefono?: string; direccion?: string; ciudad?: string }>(`${this.apiBase}/api/register/`, payload).subscribe({
      next: (data) => {
        const userEmail = data?.email || payload.email;
        const userNombre = data?.nombre || payload.nombre;

        this.setCurrentUserProfile({
          email: userEmail,
          nombre: userNombre,
          profileId: data?.profileId,
          avatarUrl: data?.avatarUrl,
          nickname: data?.nickname,
          telefono: data?.telefono,
          direccion: data?.direccion,
          ciudad: data?.ciudad,
        });

        this.authMessage.set('Registro completado. Redirigiendo a tu panel de usuario...');
        this.registerName.set('');
        this.registerUsername.set('');
        this.registerNickname.set('');
        this.registerEmail.set('');
        this.registerPassword.set('');
        this.registerConfirmPassword.set('');
        this.registerPhone.set('');
        this.registerCity.set('');
        this.registerAddress.set('');
        this.closeLogin();
        this.goToDashboard('compras');
      },
      error: (err) => {
        const message = err?.error?.detail || err?.error?.username?.[0] || err?.error?.email?.[0] || 'Error al registrar usuario.';
        this.authMessage.set(message);
      }
    });
  }

  protected handleLogout() {
    this.currentUser.set(null);
    this.profileId.set(null);
    this.profileEmail.set('');
    this.profileName.set('');
    this.profileNickname.set('');
    this.profilePhone.set('');
    this.profileAddress.set('');
    this.profileCity.set('');
    this.profileAvatarUrl.set('');
    this.profileAvatarPreview.set('');
    this.profileAvatarFile.set(null);
    this.profileUpdateMessage.set('');
    this.profileSaving.set(false);
    this.currentView.set('home');
    this.dashboardTab.set('compras');
  }

  protected goToDashboard(tab: 'compras' | 'deseos' | 'carrito' | 'cuenta' = 'compras') {
    this.currentView.set('dashboard');
    this.dashboardTab.set(tab);
  }

  protected returnToHome() {
    this.currentView.set('home');
  }

  protected openProductModal(product: Producto) {
    this.selectedProduct.set(product);
    this.showModal.set(true);
    this.updateBodyScroll();
  }

  protected closeModal() {
    this.showModal.set(false);
    this.updateBodyScroll();
  }

  protected addToCart(product: Producto) {
    console.log('Agregar al carrito:', product);
    // Aquí puedes enlazar con lógica real de carrito si la tienes disponible.
  }

  protected getProductImage(product: Producto) {
    if (!product.imagen) {
      return this.defaultImage;
    }
    return product.imagen.startsWith('http')
      ? product.imagen
      : `${this.apiBase}${product.imagen}`;
  }

  protected getProveedorName(product: Producto): string {
    if (!product.proveedor) {
      return 'N/A';
    }

    if (typeof product.proveedor === 'number') {
      return product.proveedor.toString();
    }

    return product.proveedor.nombre ?? 'N/A';
  }

  private loadMaxPrice() {
    this.http.get<{ max_price: number }>(`${this.apiBase}/api/productos/max_price/`).subscribe({
      next: (data) => {
        const maxPrice = data.max_price || 99999999;
        this.priceRangeMax.set(maxPrice);
        this.priceMaxFilter.set(maxPrice);
      },
      error: () => {
        console.error('Error loading max price');
      }
    });
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
