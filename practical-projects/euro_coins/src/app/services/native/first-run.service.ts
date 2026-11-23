import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppPreferences, Biometrics, NativePlatform, SecureStore } from './native-adapters';

/** Same key supabase-js uses in localStorage by default */
export const SESSION_KEY = `sb-${new URL(environment.supabase.url).hostname.split('.')[0]}-auth-token`;
export const FACE_ID_SETTINGS_KEY = 'face-id';
export const INSTALLED_KEY = 'secure-storage-ready';

/**
 * Prepares secure storage the first time this installation runs.
 *
 * The iOS Keychain survives deleting the app, so a reinstall would otherwise find the previous
 * session and password. Versions that kept the session in localStorage are moved over, so
 * updating the app doesn't sign anyone out.
 */
@Injectable({ providedIn: 'root' })
export class FirstRunService {
  private readonly platform = inject(NativePlatform);
  private readonly store = inject(SecureStore);
  private readonly preferences = inject(AppPreferences);
  private readonly biometrics = inject(Biometrics);

  private prepared: Promise<void> | null = null;

  /** Never rejects. Must finish before anything reads secure storage. */
  ready(): Promise<void> {
    return (this.prepared ??= this.prepare());
  }

  private async prepare(): Promise<void> {
    if (!this.platform.isNative) return;
    try {
      if ((await this.preferences.get(INSTALLED_KEY)) === '1') return;

      await ignoreErrors(this.store.remove(SESSION_KEY));
      await ignoreErrors(this.store.remove(FACE_ID_SETTINGS_KEY));
      await ignoreErrors(this.biometrics.removeCredentials());

      const legacySession = localStorage.getItem(SESSION_KEY);
      if (legacySession) {
        await this.store.set(SESSION_KEY, legacySession);
        // Only once it is safely stored
        localStorage.removeItem(SESSION_KEY);
      }
      await this.preferences.set(INSTALLED_KEY, '1');
    } catch (error) {
      console.error('Failed to prepare secure storage; trying again on the next start:', error);
    }
  }
}

async function ignoreErrors(task: Promise<void>): Promise<void> {
  try {
    await task;
  } catch {
    // Nothing stored, or it can't be read any more
  }
}
