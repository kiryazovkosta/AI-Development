import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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

  constructor() {
    if (Capacitor.getPlatform() !== 'android') return;
    // Registering a listener replaces Capacitor's default Back behaviour
    void App.addListener('backButton', () => this.onBack());
  }

  private onBack(): void {
    // An open <dialog> (the coin details) closes first, the same way Esc closes it
    const openDialog = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (openDialog) {
      openDialog.close();
      return;
    }

    const path = this.router.url.split(/[?#]/)[0];
    if (EXIT_PATHS.includes(path)) {
      void App.exitApp();
    } else {
      window.history.back();
    }
  }
}
