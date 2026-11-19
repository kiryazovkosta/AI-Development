import { Injectable, computed, signal } from '@angular/core';

/** Chromium-only event; not in the TypeScript DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * Captures the browser's install prompt so the app is installed only when the
 * user asks for it (via the "Install App" button), never automatically.
 *
 * Instantiated at app start-up (see app.config.ts), because the browser can
 * fire `beforeinstallprompt` before the user has logged in.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly deferredPrompt = signal<BeforeInstallPromptEvent | null>(null);
  private readonly standalone = signal(false);

  /** iOS/iPadOS: no `beforeinstallprompt`; installing is done via Share → Add to Home Screen. */
  readonly isIos = isIosDevice();
  /** True when the app is already running as an installed app. */
  readonly isInstalled = computed(() => this.standalone());
  /** The browser offered an install prompt we can show on demand. */
  readonly canPrompt = computed(() => this.deferredPrompt() !== null);
  /** Whether an "Install App" action makes sense on this device right now. */
  readonly canInstall = computed(() => !this.standalone() && (this.canPrompt() || this.isIos));

  constructor() {
    if (typeof window === 'undefined') return;

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () =>
      this.standalone.set(
        standaloneQuery.matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true
      );
    updateStandalone();
    standaloneQuery.addEventListener('change', updateStandalone);

    window.addEventListener('beforeinstallprompt', (event) => {
      // Stop the browser's automatic mini-infobar / install banner
      event.preventDefault();
      this.deferredPrompt.set(event as BeforeInstallPromptEvent);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt.set(null);
      this.standalone.set(true);
    });
  }

  /** Shows the browser's install dialog. Resolves to true if the user accepted. */
  async promptInstall(): Promise<boolean> {
    const event = this.deferredPrompt();
    if (!event) return false;
    // A captured prompt can be used only once
    this.deferredPrompt.set(null);
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome === 'accepted';
  }
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, but has touch
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
