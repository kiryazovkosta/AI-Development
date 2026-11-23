import { Injectable } from '@angular/core';
import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import {
  AccessControl,
  BiometricAuthError,
  BiometryType,
  NativeBiometric,
} from '@capgo/capacitor-native-biometric';

/*
 * Thin wrappers around the Capacitor plugins, so the services that use them can be tested
 * without a device. Nothing here may be called in a browser: the plugins' web versions are
 * for development only (biometric checks always succeed, storage is not encrypted).
 */

@Injectable({ providedIn: 'root' })
export class NativePlatform {
  readonly isNative = Capacitor.isNativePlatform();
  readonly isAndroid = Capacitor.getPlatform() === 'android';
}

/**
 * Encrypted key/value storage: iOS Keychain, Android Keystore.
 *
 * Don't add keys() or clear(): on iOS the plugin implements them by reading every Keychain
 * item of the app, including the password that only Face ID may release.
 */
@Injectable({ providedIn: 'root' })
export class SecureStore {
  private configured: Promise<void> | null = null;

  async get(key: string): Promise<string | null> {
    await this.configure();
    return (await SecureStorage.getItem(key)) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.configure();
    await SecureStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.configure();
    await SecureStorage.removeItem(key);
  }

  private configure(): Promise<void> {
    return (this.configured ??= (async () => {
      await SecureStorage.setKeyPrefix('eurocoins_');
      // Never leaves this device. Not "whenUnlocked": a session refreshed just as the phone
      // locks must still be stored, or its replacement token is lost and the user signed out.
      await SecureStorage.setDefaultKeychainAccess(KeychainAccess.afterFirstUnlockThisDeviceOnly);
    })());
  }
}

/** Plain app preferences. Deleted with the app, unlike the iOS Keychain. */
@Injectable({ providedIn: 'root' })
export class AppPreferences {
  async get(key: string): Promise<string | null> {
    return (await Preferences.get({ key })).value;
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }
}

@Injectable({ providedIn: 'root' })
export class AppLifecycle {
  async isActive(): Promise<boolean> {
    return (await App.getState()).isActive;
  }

  /** The app went to the background. The Face ID sheet does not trigger this on iOS. */
  onPause(callback: () => void): void {
    void App.addListener('pause', callback);
  }

  onResume(callback: () => void): void {
    void App.addListener('resume', callback);
  }

  /** Also fires for system sheets such as Face ID itself */
  onActiveChange(callback: (isActive: boolean) => void): void {
    void App.addListener('appStateChange', ({ isActive }) => callback(isActive));
  }

  exitApp(): void {
    void App.exitApp();
  }

  onBackButton(callback: () => void): void {
    void App.addListener('backButton', callback);
  }
}

export type BiometricFailure = 'cancelled' | 'failed' | 'not-found' | 'unavailable';

export class BiometricError extends Error {
  constructor(readonly reason: BiometricFailure) {
    super(`Biometric check: ${reason}`);
  }
}

export interface SavedCredentials {
  email: string;
  password: string;
}

const CREDENTIALS_ID = 'com.kiryazovkosta.eurocoins.login';

/** Face ID / Touch ID / Android biometrics */
@Injectable({ providedIn: 'root' })
export class Biometrics {
  /** The name to show for the device's biometrics, or null when none is set up */
  async availableName(): Promise<string | null> {
    const { isAvailable, strongBiometryIsAvailable, biometryType } =
      await NativeBiometric.isAvailable();
    // Saved passwords need strong biometrics
    if (!isAvailable || !strongBiometryIsAvailable) return null;
    if (biometryType === BiometryType.FACE_ID) return 'Face ID';
    if (biometryType === BiometryType.TOUCH_ID) return 'Touch ID';
    return 'Biometrics';
  }

  /** Asks for Face ID, falling back to the device passcode */
  async verify(reason: string): Promise<void> {
    await wrapErrors(
      NativeBiometric.verifyIdentity({
        reason,
        title: 'Euro Coins',
        subtitle: reason,
        useFallback: true, // iOS passcode
        allowedBiometryTypes: [
          // Android passcode
          BiometryType.FINGERPRINT,
          BiometryType.FACE_AUTHENTICATION,
          BiometryType.DEVICE_CREDENTIAL,
        ],
      })
    );
  }

  async hasCredentials(): Promise<boolean> {
    return (await NativeBiometric.isCredentialsSaved({ server: CREDENTIALS_ID })).isSaved;
  }

  /** The system releases these only after Face ID, and drops them if the enrolled faces change */
  async saveCredentials({ email, password }: SavedCredentials): Promise<void> {
    // The plugin only replaces an entry with the same username. Without this, signing in with
    // another account would leave two entries, and reading could return the wrong one.
    await this.removeCredentials();
    await wrapErrors(
      NativeBiometric.setCredentials({
        server: CREDENTIALS_ID,
        username: email,
        password,
        accessControl: AccessControl.BIOMETRY_CURRENT_SET,
        title: 'Save sign-in',
      })
    );
  }

  async readCredentials(reason: string): Promise<SavedCredentials> {
    const { username, password } = await wrapErrors(
      NativeBiometric.getSecureCredentials({
        server: CREDENTIALS_ID,
        reason,
        title: 'Euro Coins',
        subtitle: reason,
      })
    );
    return { email: username, password };
  }

  async removeCredentials(): Promise<void> {
    await NativeBiometric.deleteCredentials({ server: CREDENTIALS_ID });
  }
}

async function wrapErrors<T>(call: Promise<T>): Promise<T> {
  try {
    return await call;
  } catch (error) {
    throw new BiometricError(failureOf(error));
  }
}

function failureOf(error: unknown): BiometricFailure {
  const code = Number((error as { code?: unknown } | null)?.code);
  switch (code) {
    case BiometricAuthError.USER_CANCEL:
    case BiometricAuthError.SYSTEM_CANCEL:
    case BiometricAuthError.APP_CANCEL:
    case BiometricAuthError.USER_FALLBACK:
    case BiometricAuthError.NOT_INTERACTIVE:
      return 'cancelled';
    case BiometricAuthError.NO_PROTECTED_CREDENTIALS_FOUND:
      return 'not-found';
    case BiometricAuthError.BIOMETRICS_UNAVAILABLE:
    case BiometricAuthError.BIOMETRICS_NOT_ENROLLED:
    case BiometricAuthError.PASSCODE_NOT_SET:
      return 'unavailable';
    default:
      // "Authentication not available" comes without a code
      return Number.isNaN(code) ? 'unavailable' : 'failed';
  }
}
