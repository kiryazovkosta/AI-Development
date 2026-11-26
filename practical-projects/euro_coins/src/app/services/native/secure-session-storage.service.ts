import { Injectable, inject } from '@angular/core';
import { AppLockService } from './app-lock.service';
import { FaceIdSettingsService } from './face-id-settings.service';
import { FirstRunService, SESSION_KEY } from './first-run.service';
import { SecureStore } from './native-adapters';

/**
 * Where supabase-js keeps the session in the native app (its `auth.storage` option): the iOS
 * Keychain or Android Keystore instead of localStorage. The session is not read before the
 * app is unlocked.
 */
@Injectable({ providedIn: 'root' })
export class SecureSessionStorage {
  private readonly store = inject(SecureStore);
  private readonly firstRun = inject(FirstRunService);
  private readonly settings = inject(FaceIdSettingsService);
  private readonly appLock = inject(AppLockService);

  /** supabase-js reads the session on every request; only the first read goes to the Keychain */
  private session: string | null = null;
  private loaded: Promise<void> | null = null;
  /** Set once the session was written or removed, so a slower first read can't undo that */
  private changed = false;

  async getItem(key: string): Promise<string | null> {
    if (key !== SESSION_KEY) {
      await this.firstRun.ready();
      return this.store.get(key);
    }
    await (this.loaded ??= this.load());
    return this.session;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.firstRun.ready();
    if (key !== SESSION_KEY) return this.store.set(key, value);

    this.changed = true;
    this.session = value;
    // First the flag, so a stored session can never be missed by the lock
    await this.settings.update({ signedOut: false });
    await this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.firstRun.ready();
    if (key !== SESSION_KEY) return this.store.remove(key);

    this.changed = true;
    this.session = null;
    await this.store.remove(key);
    await this.settings.update({ signedOut: true });
  }

  /** Drops the session on this device, even while the app is locked and without a network */
  async discard(): Promise<void> {
    await this.removeItem(SESSION_KEY);
    this.appLock.discardAtStart();
  }

  private async load(): Promise<void> {
    await this.firstRun.ready();
    if (!(await this.appLock.waitAtStart())) return;
    try {
      const stored = await this.store.get(SESSION_KEY);
      if (!this.changed) this.session = stored;
    } catch (error) {
      // For example restored to another device, where its key doesn't exist
      console.error('Failed to read the stored session:', error);
      await this.store.remove(SESSION_KEY).catch(() => undefined);
    }
  }
}
