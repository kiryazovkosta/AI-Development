import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppLockService } from './native/app-lock.service';
import { AppLifecycle, NativePlatform } from './native/native-adapters';

/** Start screens: Back here leaves the app instead of going back in history. */
const EXIT_PATHS = ['/collection', '/login'];

/**
 * Android hardware Back button in the native (Capacitor) app.
 *
 * Capacitor's default walks the WebView history, but logging in, logging out and
 * the route guards all push history entries, so Back on the start screen would
 * bounce between /collection and /login and never leave the app.
 *
 * Instantiated at app start-up (see app.config.ts); does nothing outside Android.
 */
@Injectable({ providedIn: 'root' })
export class NativeBackButtonService {
  private readonly router = inject(Router);
  private readonly appLock = inject(AppLockService);
  private readonly lifecycle = inject(AppLifecycle);

  constructor() {
    if (!inject(NativePlatform).isAndroid) return;
    // Registering a listener replaces Capacitor's default Back behaviour
    this.lifecycle.onBackButton(() => this.onBack());
  }

  private onBack(): void {
    // The lock screen is a <dialog> too, and must never be closed by Back
    if (this.appLock.locked()) {
      this.lifecycle.exitApp();
      return;
    }

    // An open <dialog> (the coin details) closes first, the same way Esc closes it
    const openDialog = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (openDialog) {
      openDialog.close();
      return;
    }

    const path = this.router.url.split(/[?#]/)[0];
    if (EXIT_PATHS.includes(path)) {
      this.lifecycle.exitApp();
    } else {
      window.history.back();
    }
  }
}
