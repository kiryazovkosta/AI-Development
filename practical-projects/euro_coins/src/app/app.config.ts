import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { Capacitor } from '@capacitor/core';

import { routes } from './app.routes';
import { PwaInstallService } from './services/pwa-install.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({
      anchorScrolling: 'enabled',
      scrollPositionRestoration:'enabled'
    })),
    provideServiceWorker('ngsw-worker.js', {
      // The native Android/iOS app (Capacitor) already ships all files offline;
      // a service worker there would only serve stale builds after an update.
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    // Start listening for the browser's install prompt before anyone logs in
    provideAppInitializer(() => {
      inject(PwaInstallService);
    }),
  ],
};
