import { Provider } from '@angular/core';
import {
  AppLifecycle,
  AppPreferences,
  BiometricError,
  Biometrics,
  NativePlatform,
  SavedCredentials,
  SecureStore,
} from './native-adapters';

/** A fake phone for specs: secure storage, preferences, biometrics and app lifecycle */
export class FakeDevice {
  isNative = true;
  isAndroid = false;
  secure = new Map<string, string>();
  prefs = new Map<string, string>();
  credentials: SavedCredentials | null = null;
  biometryName: string | null = 'Face ID';
  active = true;

  /** What the next Face ID prompts answer; a missing answer succeeds */
  verifyAnswers: (BiometricError | Promise<void>)[] = [];
  readAnswers: BiometricError[] = [];
  readonly verify = jasmine.createSpy('verify').and.callFake(async () => {
    const answer = this.verifyAnswers.shift();
    if (answer instanceof BiometricError) throw answer;
    await answer;
  });
  readonly secureGet = jasmine
    .createSpy('secureGet')
    .and.callFake(async (key: string) => this.secure.get(key) ?? null);
  readonly secureSet = jasmine
    .createSpy('secureSet')
    .and.callFake(async (key: string, value: string) => void this.secure.set(key, value));
  readonly exitApp = jasmine.createSpy('exitApp');

  pause: () => void = () => {};
  resume: () => void = () => {};
  setActive: (active: boolean) => void = () => {};
  back: () => void = () => {};

  providers(): Provider[] {
    return [
      { provide: NativePlatform, useValue: { isNative: this.isNative, isAndroid: this.isAndroid } },
      {
        provide: SecureStore,
        useValue: {
          get: this.secureGet,
          set: this.secureSet,
          remove: async (key: string) => void this.secure.delete(key),
        },
      },
      {
        provide: AppPreferences,
        useValue: {
          get: async (key: string) => this.prefs.get(key) ?? null,
          set: async (key: string, value: string) => void this.prefs.set(key, value),
        },
      },
      {
        provide: AppLifecycle,
        useValue: {
          isActive: async () => this.active,
          onPause: (callback: () => void) => (this.pause = callback),
          onResume: (callback: () => void) => (this.resume = callback),
          onActiveChange: (callback: (active: boolean) => void) => (this.setActive = callback),
          onBackButton: (callback: () => void) => (this.back = callback),
          exitApp: this.exitApp,
        },
      },
      {
        provide: Biometrics,
        useValue: {
          availableName: async () => this.biometryName,
          verify: this.verify,
          hasCredentials: async () => this.credentials !== null,
          saveCredentials: async (credentials: SavedCredentials) =>
            void (this.credentials = credentials),
          readCredentials: async () => {
            const answer = this.readAnswers.shift();
            if (answer) throw answer;
            if (!this.credentials) throw new BiometricError('not-found');
            return this.credentials;
          },
          removeCredentials: async () => void (this.credentials = null),
        },
      },
    ];
  }

}

/** Lets pending promise callbacks run */
export async function settle(): Promise<void> {
  for (let i = 0; i < 60; i++) await Promise.resolve();
}
