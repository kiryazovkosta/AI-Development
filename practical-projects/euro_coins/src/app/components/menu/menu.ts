import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { BUILD_INFO } from '../../build-info';
import { AuthService } from '../../services/auth.service';
import { BiometricLoginService } from '../../services/biometric-login.service';
import { NativePlatform } from '../../services/native/native-adapters';

const ADMIN_ROUTES = ['/coins/new', '/users/new'];

/**
 * Main menu: a bar on wide screens, a button with a slide-in drawer on narrow ones.
 * Admin pages are an "Admin" dropdown in the bar and a flat labelled group in the drawer,
 * because nested menus are awkward on a phone.
 *
 * The drawer is a modal <dialog>, so Esc and Android's Back button close it
 * (see NativeBackButtonService), and the lock screen still covers it.
 */
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu.css',
})
export class MenuComponent {
  protected readonly authService = inject(AuthService);
  protected readonly biometricLogin = inject(BiometricLoginService);
  /** Only the mobile app shows it in the menu; null in a browser */
  protected readonly buildInfo = inject(NativePlatform).isNative ? inject(BUILD_INFO) : null;
  protected readonly togglingFaceId = signal(false);
  protected readonly signingOut = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly adminMenuOpen = signal(false);
  /** Highlights the "Admin" dropdown while one of its pages is open */
  protected readonly adminRouteActive = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly drawer = viewChild<ElementRef<HTMLDialogElement>>('drawer');

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.biometricLogin.refresh();
      } else {
        // The drawer is removed without a "close" event
        this.drawerOpen.set(false);
      }
    });

    // Skipped: choosing the page that is already open
    const router = inject(Router);
    router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart || event instanceof NavigationSkipped) {
        this.closeDrawer();
        this.adminMenuOpen.set(false);
      }
      if (event instanceof NavigationEnd) {
        this.adminRouteActive.set(ADMIN_ROUTES.some((route) => router.url.startsWith(route)));
      }
    });

    // A click anywhere outside the dropdown closes it
    const onDocumentClick = (event: MouseEvent) => {
      if (!this.adminMenuOpen()) return;
      const menu = this.host.nativeElement.querySelector('.admin-menu');
      if (menu && !menu.contains(event.target as Node)) this.adminMenuOpen.set(false);
    };
    document.addEventListener('click', onDocumentClick);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('click', onDocumentClick));
  }

  /** Keyboard users tabbing out of the dropdown close it */
  protected onAdminFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && !(event.currentTarget as HTMLElement).contains(next)) this.adminMenuOpen.set(false);
  }

  /** Esc inside the list: close it and give focus back to the "Admin" button */
  protected closeAdminMenu(focusToggle: boolean): void {
    this.adminMenuOpen.set(false);
    if (focusToggle) {
      this.host.nativeElement.querySelector<HTMLElement>('.admin-toggle')?.focus();
    }
  }

  protected openDrawer(): void {
    const drawer = this.drawer()?.nativeElement;
    if (!drawer || drawer.open) return;
    drawer.showModal();
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    this.drawer()?.nativeElement.close();
  }

  /** The drawer's content fills it, so only a click on the backdrop targets the dialog itself */
  protected onDrawerClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDrawer();
  }

  protected async onToggleFaceId(): Promise<void> {
    this.togglingFaceId.set(true);
    try {
      await (this.biometricLogin.enabled()
        ? this.biometricLogin.disable()
        : this.biometricLogin.enable());
    } catch (error) {
      console.error('Failed to change the Face ID setting:', error);
    } finally {
      this.togglingFaceId.set(false);
    }
  }

  protected async onLogout(): Promise<void> {
    this.signingOut.set(true);
    try {
      await this.authService.logout();
    } finally {
      this.signingOut.set(false);
    }
  }
}
