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
  protected readonly authToken = signal<string | null>(null);
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
  protected readonly compras = signal<any[]>([]);
  protected readonly listaDeseos = signal<any[]>([]);
  protected readonly carrito = signal<{ producto: Producto; cantidad: number }[]>([]);
  protected readonly pendingAction = signal<{ type: 'purchase' | 'addToCart' | 'wishlist' | 'review'; product: Producto } | null>(null);
  protected readonly productoEnListaDeseos = signal<{ [key: number]: boolean }>({});
  protected readonly loadingCompras = signal(false);
  protected readonly loadingDeseos = signal(false);
  protected readonly showPurchaseModal = signal(false);
  protected readonly purchaseQuantity = signal(1);
  protected readonly purchaseMessage = signal('');
  protected readonly purchaseLoading = signal(false);
  protected readonly purchaseEstimatedDate = signal('');
  protected readonly repurchaseMessage = signal<{ [key: number]: string }>({});
  protected readonly showReviewModal = signal(false);
  protected readonly selectedReviewProduct = signal<Producto | null>(null);
  protected readonly reviewRating = signal<{ [key: number]: number }>({});
  protected readonly reviewComment = signal<{ [key: number]: string }>({});
  protected readonly reviewSubmitting = signal<{ [key: number]: boolean }>({});
  protected readonly reviewMessage = signal<{ [key: number]: string }>({});
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
    this.restoreSessionFromStorage();
    this.loadMaxPrice();
    this.loadProducts();
  }

  private restoreSessionFromStorage() {
    try {
      const savedSession = localStorage.getItem('userSession');
      if (savedSession) {
        const userData = JSON.parse(savedSession);
        this.setCurrentUserProfile(userData);
        if (userData.token) {
          this.authToken.set(userData.token);
        }
      }
    } catch (error) {
      console.error('Error al restaurar sesión:', error);
      localStorage.removeItem('userSession');
    }
  }

  private saveSessionToStorage(data: {
    email: string;
    nombre: string;
    profileId?: number | null;
    avatarUrl?: string | null;
    nickname?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  }) {
    try {
      localStorage.setItem('userSession', JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar sesión:', error);
    }
  }

  private saveAuthToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem('authToken', token);
        this.authToken.set(token);
      } else {
        localStorage.removeItem('authToken');
        this.authToken.set(null);
      }
    } catch (e) {
      console.error('Error saving auth token', e);
    }
  }

  private getAuthHeader(): Record<string, string> {
    const token = this.authToken() || localStorage.getItem('authToken');
    return token ? { Authorization: `Token ${token}` } : {} as Record<string, string>;
  }

  private clearSessionFromStorage() {
    try {
      localStorage.removeItem('userSession');
    } catch (error) {
      console.error('Error al limpiar sesión:', error);
    }
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

  private scrollDisabled = false;
  private preventScroll = (e: Event) => {
    e.preventDefault();
  };

  protected updateBodyScroll() {
    const isModalOpen = this.showModal() || this.showLogin() || this.showPurchaseModal() || this.showReviewModal();
    document.body.classList.toggle('modal-open', isModalOpen);
    document.documentElement.classList.toggle('modal-open', isModalOpen);

    if (isModalOpen && !this.scrollDisabled) {
      document.addEventListener('touchmove', this.preventScroll as EventListener, { passive: false } as AddEventListenerOptions);
      document.addEventListener('wheel', this.preventScroll as EventListener, { passive: false } as AddEventListenerOptions);
      this.scrollDisabled = true;
    } else if (!isModalOpen && this.scrollDisabled) {
      document.removeEventListener('touchmove', this.preventScroll as EventListener);
      document.removeEventListener('wheel', this.preventScroll as EventListener);
      this.scrollDisabled = false;
    }
  }

  protected openReviewModal(product: Producto) {
    this.selectedReviewProduct.set(product);
    this.showReviewModal.set(true);
    this.reviewMessage.set({ ...(this.reviewMessage() || {}), [product.id]: '' });
    this.updateBodyScroll();
  }

  protected hasReviewedProduct(product: Producto) {
    const user = this.currentUser();
    if (!user || !product?.reviews?.length) {
      return false;
    }
    return product.reviews.some((review) => review.usuario?.email === user.email);
  }

  protected closeReviewModal() {
    this.showReviewModal.set(false);
    this.selectedReviewProduct.set(null);
    this.updateBodyScroll();
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
    token?: string | null;
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

    // Guardar sesión en localStorage y token antes de cargar datos protegidos
    this.saveSessionToStorage(data);
    if (data.token) {
      this.saveAuthToken(data.token);
      try {
        const session = JSON.parse(localStorage.getItem('userSession') || '{}');
        session.token = data.token;
        localStorage.setItem('userSession', JSON.stringify(session));
      } catch (e) {}
    }

    // Cargar compras y lista de deseos del usuario
    this.loadUserCompras();
    this.loadUserListaDeseos();
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
      formData,
      { headers: { ...this.getAuthHeader(), 'X-CSRFToken': this.getCsrfToken() } }
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

      this.http.post<{ email: string; nombre: string; profileId?: number; avatarUrl?: string; nickname?: string; telefono?: string; direccion?: string; ciudad?: string; token?: string }>(
        `${this.apiBase}/api/login/`,
        payload,
        { withCredentials: true }
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
            token: data.token,
          });
          this.authMessage.set('Acceso exitoso.');
          // Ejecutar acción pendiente si existe, si no llevar al panel
          this.closeLogin();
          if (this.pendingAction()) {
            this.executePendingAction();
          } else {
            this.goToDashboard('compras');
          }
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

    this.http.post<{ email?: string; nombre?: string; profileId?: number; avatarUrl?: string; nickname?: string; telefono?: string; direccion?: string; ciudad?: string; token?: string }>(`${this.apiBase}/api/register/`, payload).subscribe({
      next: (data) => {
        const userEmail = data?.email || payload.email;
        const userNombre = data?.nombre || payload.nombre;

        this.setCurrentUserProfile({
          email: userEmail,
          nombre: userNombre,
          profileId: data?.profileId,
          avatarUrl: data?.avatarUrl,
          token: data?.token,
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
        if (this.pendingAction()) {
          this.executePendingAction();
        } else {
          this.goToDashboard('compras');
        }
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
    this.compras.set([]);
    this.listaDeseos.set([]);
    this.productoEnListaDeseos.set({});
    
    // Limpiar sesión del localStorage
    this.clearSessionFromStorage();
    this.saveAuthToken(null);
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
    if (!this.isLoggedIn()) {
      // Guardar la acción pendiente y pedir login
      this.pendingAction.set({ type: 'addToCart', product });
      this.closeModal();
      this.openLoginModal();
      return;
    }

    const existing = this.carrito().find((item) => item.producto.id === product.id);
    if (existing) {
      existing.cantidad += 1;
      this.carrito.set([...this.carrito()]);
    } else {
      this.carrito.set([...this.carrito(), { producto: product, cantidad: 1 }]);
    }
  }

  protected parsePrice(value: string | number) {
    return typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
  }

  protected startPurchase(product: Producto) {
    if (!this.isLoggedIn()) {
      this.pendingAction.set({ type: 'purchase', product });
      this.closeModal();
      this.openLoginModal();
      return;
    }

    this.selectedProduct.set(product);
    this.purchaseQuantity.set(1);
    this.purchaseMessage.set('');
    this.purchaseLoading.set(false);
    this.purchaseEstimatedDate.set(this.generateRandomDeliveryDate());
    this.showModal.set(false);
    this.showPurchaseModal.set(true);
    this.updateBodyScroll();
  }

  protected cancelPurchase() {
    this.showPurchaseModal.set(false);
    this.purchaseMessage.set('');
    this.purchaseLoading.set(false);
    this.updateBodyScroll();
  }

  protected changePurchaseQuantity(value: string) {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 1) {
      this.purchaseQuantity.set(1);
      return;
    }
    this.purchaseQuantity.set(quantity);
  }

  protected getPurchaseTotal() {
    const product = this.selectedProduct();
    const quantity = this.purchaseQuantity();
    if (!product) {
      return 0;
    }
    const price = typeof product.precio === 'string' ? parseFloat(product.precio) : Number(product.precio);
    return Number.isFinite(price) ? price * quantity : 0;
  }

  protected formatCurrency(value: number) {
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
  }

  protected generateRandomDeliveryDate() {
    const now = new Date();
    const days = Math.floor(Math.random() * 30) + 1;
    const delivery = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return delivery.toISOString().split('T')[0];
  }

  protected submitPurchase(event: Event) {
    event.preventDefault();
    const product = this.selectedProduct();
    if (!product) {
      this.purchaseMessage.set('No se encontró el producto.');
      return;
    }

    const cantidad = this.purchaseQuantity();
    if (cantidad < 1) {
      this.purchaseMessage.set('Debes ingresar una cantidad válida.');
      return;
    }

    this.purchaseLoading.set(true);
    this.http.post<any>(`${this.apiBase}/api/pedidos/comprar/`, {
      producto_id: product.id,
      cantidad,
    }, { headers: this.getAuthHeader() }).subscribe({
      next: (data) => {
        this.purchaseMessage.set('Compra realizada correctamente.');
        this.showPurchaseModal.set(false);
        this.updateBodyScroll();
        this.selectedProduct.set(null);
        this.loadProducts();
        this.loadUserCompras();
        this.goToDashboard('compras');
      },
      error: (err) => {
        this.purchaseMessage.set(err?.error?.detail || 'Error al procesar la compra.');
        console.error('Error compra:', err);
      },
      complete: () => {
        this.purchaseLoading.set(false);
      }
    });
  }

  protected repurchase(productId: number) {
    // Buscar el producto en el listado actual para conocer stock
    const product = this.products().find((p) => p.id === productId);
    if (!product || Number(product.stock) <= 0) {
      const mapa = { ...(this.repurchaseMessage() || {}) };
      mapa[productId] = 'Lo siento, se ha agotado el stock';
      this.repurchaseMessage.set(mapa);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        const m = { ...(this.repurchaseMessage() || {}) };
        delete m[productId];
        this.repurchaseMessage.set(m);
      }, 3000);
      return;
    }

    // Si hay stock, iniciar compra como en el modal
    this.startPurchase(product);
  }

  protected submitReview(productId: number) {
    const rating = this.reviewRating()[productId] || 0;
    const comentario = this.reviewComment()[productId] || '';

    if (!rating || rating < 1 || rating > 5) {
      const mapa = { ...(this.reviewMessage() || {}) };
      mapa[productId] = 'Selecciona una calificación entre 1 y 5 estrellas.';
      this.reviewMessage.set(mapa);
      setTimeout(() => {
        const m = { ...(this.reviewMessage() || {}) };
        delete m[productId];
        this.reviewMessage.set(m);
      }, 3000);
      return;
    }

    if (!this.isLoggedIn()) {
      const product = this.products().find((p) => p.id === productId);
      if (product) {
        this.pendingAction.set({ type: 'review', product });
      }
      this.closeReviewModal();
      this.openLoginModal();
      return;
    }

    const headers = { ...this.getAuthHeader(), 'Content-Type': 'application/json' };
    this.reviewSubmitting.set({ ...(this.reviewSubmitting() || {}), [productId]: true });
    this.http.post<any>(`${this.apiBase}/api/reviews/`, { producto: productId, rating, comentario }, { headers }).subscribe({
      next: (data) => {
        // refresh product data so average_rating and reviews update
        this.loadProducts();
        this.loadUserCompras();
        // clear inputs
        const r = { ...(this.reviewRating() || {}) };
        const c = { ...(this.reviewComment() || {}) };
        delete r[productId];
        delete c[productId];
        this.reviewRating.set(r);
        this.reviewComment.set(c);
        const messageMap = { ...(this.reviewMessage() || {}) };
        messageMap[productId] = 'Gracias por tu valoración.';
        this.reviewMessage.set(messageMap);
        setTimeout(() => {
          const m = { ...(this.reviewMessage() || {}) };
          delete m[productId];
          this.reviewMessage.set(m);
        }, 2000);
      },
      error: (err) => {
        console.error('Error al enviar reseña:', err);
        this.reviewMessage.set({ ...(this.reviewMessage() || {}), [productId]: err?.error?.detail || 'Error al enviar reseña.' });
      },
      complete: () => {
        this.reviewSubmitting.set({ ...(this.reviewSubmitting() || {}), [productId]: false });
      }
    });
  }

  protected setReviewRating(productId: number, rating: number) {
    const map = { ...(this.reviewRating() || {}) };
    map[productId] = rating;
    this.reviewRating.set(map);
  }

  protected setReviewComment(productId: number, value: string) {
    const map = { ...(this.reviewComment() || {}) };
    map[productId] = value;
    this.reviewComment.set(map);
  }

  protected marcarPedidoRecibido(pedidoId: number) {
    this.http.post<any>(`${this.apiBase}/api/pedidos/${pedidoId}/recibido/`, {}, { headers: this.getAuthHeader() }).subscribe({
      next: () => {
        this.loadUserCompras();
      },
      error: (err) => {
        console.error('Error al marcar pedido recibido:', err);
      }
    });
  }

  protected getProductImage(product: Producto) {
    if (!product.imagen) {
      return this.defaultImage;
    }
    return product.imagen.startsWith('http')
      ? product.imagen
      : `${this.apiBase}${product.imagen}`;
  }

  protected getRemainingTime(dateString: string) {
    if (!dateString) {
      return '';
    }
    const today = new Date();
    const target = new Date(dateString);
    const diffMs = target.getTime() - today.getTime();
    if (diffMs <= 0) {
      return 'Hoy';
    }
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days === 1 ? '1 día restante' : `${days} días restantes`;
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
        this.products.set(data.filter((product) => Number(product.stock) > 0));
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadUserCompras() {
    const authHeader = this.getAuthHeader();
    if (!authHeader['Authorization']) {
      this.compras.set([]);
      this.loadingCompras.set(false);
      return;
    }

    this.loadingCompras.set(true);
    this.http.get<any[]>(`${this.apiBase}/api/pedidos/mis_compras/`, { headers: authHeader }).subscribe({
      next: (data) => {
        this.compras.set(data);
      },
      error: () => {
        this.compras.set([]);
        console.error('Error al cargar compras');
      },
      complete: () => {
        this.loadingCompras.set(false);
      }
    });
  }

  private loadUserListaDeseos() {
    const authHeader = this.getAuthHeader();
    if (!authHeader['Authorization']) {
      this.listaDeseos.set([]);
      this.productoEnListaDeseos.set({});
      this.loadingDeseos.set(false);
      return;
    }

    this.loadingDeseos.set(true);
    this.http.get<{ productos: Producto[] }>(`${this.apiBase}/api/lista-deseos/`, { headers: authHeader }).subscribe({
      next: (data) => {
        this.listaDeseos.set(data.productos || []);
        const mapaDeseos: { [key: number]: boolean } = {};
        (data.productos || []).forEach((p: Producto) => {
          mapaDeseos[p.id] = true;
        });
        this.productoEnListaDeseos.set(mapaDeseos);
      },
      error: () => {
        this.listaDeseos.set([]);
        this.productoEnListaDeseos.set({});
        console.error('Error al cargar lista de deseos');
      },
      complete: () => {
        this.loadingDeseos.set(false);
      }
    });
  }

  protected agregarAListaDeseos(producto: Producto) {
    if (!this.isLoggedIn()) {
      this.pendingAction.set({ type: 'wishlist', product: producto });
      this.closeModal();
      this.openLoginModal();
      return;
    }

    this.http.post(`${this.apiBase}/api/lista-deseos/`, { producto_id: producto.id }, { headers: { ...this.getAuthHeader(), 'X-CSRFToken': this.getCsrfToken() } }).subscribe({
      next: (data: any) => {
        const mapaDeseos: { [key: number]: boolean } = {};
        (data.productos || []).forEach((p: Producto) => {
          mapaDeseos[p.id] = true;
        });
        this.productoEnListaDeseos.set(mapaDeseos);
        this.listaDeseos.set(data.productos || []);
      },
      error: (err) => {
        console.error('Error al agregar a lista de deseos:', err);
      }
    });
  }

  protected executePendingAction() {
    const action = this.pendingAction();
    if (!action) return;
    // Clear pending action before executing to avoid loops
    this.pendingAction.set(null);

    const { type, product } = action;
    if (type === 'purchase') {
      // open purchase modal for product
      this.startPurchase(product);
      return;
    }

    if (type === 'review') {
      this.openReviewModal(product);
      return;
    }

    // For addToCart and wishlist: reopen product modal and then perform the action
    this.selectedProduct.set(product);
    this.showModal.set(true);
    this.updateBodyScroll();

    if (type === 'addToCart') {
      this.addToCart(product);
      return;
    }

    if (type === 'wishlist') {
      this.agregarAListaDeseos(product);
      return;
    }
  }

  protected removerDeListaDeseos(productoId: number) {
    this.http.delete(`${this.apiBase}/api/lista-deseos/remove/`, {
      body: { producto_id: productoId },
      headers: { ...this.getAuthHeader(), 'X-CSRFToken': this.getCsrfToken() }
    }).subscribe({
      next: (data: any) => {
        const mapaDeseos: { [key: number]: boolean } = {};
        (data.productos || []).forEach((p: Producto) => {
          mapaDeseos[p.id] = true;
        });
        this.productoEnListaDeseos.set(mapaDeseos);
        this.listaDeseos.set(data.productos || []);
      },
      error: (err) => {
        console.error('Error al remover de lista de deseos:', err);
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

  private getCsrfToken(): string {
    const match = document.cookie.match(/(^|; )csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : '';
  }
}
