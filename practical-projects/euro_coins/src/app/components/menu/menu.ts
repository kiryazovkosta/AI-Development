import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
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

/**
 * Main menu: a bar on wide screens, a button with a slide-in drawer on narrow ones.
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
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart || event instanceof NavigationSkipped) {
          this.closeDrawer();
        }
      });
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
