import { Injectable, computed, inject, signal } from '@angular/core';
import { FACE_ID_SETTINGS_KEY, FirstRunService } from './first-run.service';
import { NativePlatform, SecureStore } from './native-adapters';

interface FaceIdSettings {
  /** Lock the app, and keep the password for signing in */
  enabled: boolean;
  /** The account it was turned on for */
  email: string | null;
  /** The account that answered "Not now" */
  declinedBy: string | null;
  /** No session is stored, so there is nothing to lock */
  signedOut: boolean;
}

const DEFAULTS: FaceIdSettings = {
  enabled: false,
  email: null,
  declinedBy: null,
  signedOut: false,
};

@Injectable({ providedIn: 'root' })
export class FaceIdSettingsService {
  private readonly platform = inject(NativePlatform);
  private readonly store = inject(SecureStore);
  private readonly firstRun = inject(FirstRunService);

  private readonly settings = signal<FaceIdSettings>(DEFAULTS);
  private loaded: Promise<void> | null = null;

  readonly enabled = computed(() => this.settings().enabled);
  readonly email = computed(() => this.settings().email);
  readonly declinedBy = computed(() => this.settings().declinedBy);
  readonly signedOut = computed(() => this.settings().signedOut);

  /** Never rejects */
  ready(): Promise<void> {
    return (this.loaded ??= this.load());
  }

  async update(changes: Partial<FaceIdSettings>): Promise<void> {
    if (!this.platform.isNative) return;
    await this.ready();
    const next = { ...this.settings(), ...changes };
    if (JSON.stringify(next) === JSON.stringify(this.settings())) return;
    this.settings.set(next);
    await this.store.set(FACE_ID_SETTINGS_KEY, JSON.stringify(next));
  }

  private async load(): Promise<void> {
    if (!this.platform.isNative) return;
    await this.firstRun.ready();
    try {
      const stored = await this.store.get(FACE_ID_SETTINGS_KEY);
      if (stored) this.settings.set({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch (error) {
      console.error('Failed to read the Face ID settings:', error);
    }
  }
}
