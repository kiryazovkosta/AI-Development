import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { FaceIdSettingsService } from './native/face-id-settings.service';
import { FirstRunService } from './native/first-run.service';
import { BiometricError, Biometrics, NativePlatform } from './native/native-adapters';

export type BiometricSignIn =
  | 'signed-in'
  /** Nothing to tell the user */
  | 'cancelled'
  /** The saved password was changed or is no longer readable, and has been removed */
  | 'outdated'
  /** The biometric check failed */
  | 'failed'
  /** Supabase could not be reached or refused; AuthService.authError says why */
  | 'error';

/**
 * Turns Face ID on and off, and signs in with the password it protects. Native app only;
 * in a browser `name` stays null and nothing is ever stored.
 */
@Injectable({ providedIn: 'root' })
export class BiometricLoginService {
  private readonly platform = inject(NativePlatform);
  private readonly biometrics = inject(Biometrics);
  private readonly settings = inject(FaceIdSettingsService);
  private readonly firstRun = inject(FirstRunService);
  private readonly authService = inject(AuthService);

  private readonly nameSignal = signal<string | null>(null);
  private readonly hasSavedSignal = signal(false);

  /** "Face ID", "Touch ID"...; null when the device has none set up, and in a browser */
  readonly name = this.nameSignal.asReadonly();
  readonly hasSaved = this.hasSavedSignal.asReadonly();
  readonly enabled = this.settings.enabled;
  /** Label of the on/off button. Stays available when Face ID was removed after turning it on. */
  readonly toggleLabel = computed(
    () => this.nameSignal() ?? (this.settings.enabled() ? 'App lock' : null)
  );

  async refresh(): Promise<void> {
    if (!this.platform.isNative) return;
    await this.firstRun.ready();
    await this.settings.ready();
    try {
      this.nameSignal.set(await this.biometrics.availableName());
      this.hasSavedSignal.set(this.settings.enabled() && (await this.biometrics.hasCredentials()));
    } catch (error) {
      console.error('Failed to check for biometrics:', error);
      this.nameSignal.set(null);
      this.hasSavedSignal.set(false);
    }
  }

  /**
   * Call after signing in with a password. Resolves to true when the user should be asked
   * whether to use Face ID.
   */
  async onPasswordSignIn(email: string, password: string): Promise<boolean> {
    if (!this.platform.isNative) return false;
    const account = normalize(email);
    try {
      await this.refresh();
      if (this.settings.email() && this.settings.email() !== account) {
        await this.turnOff();
      }
      if (!this.nameSignal()) return false;
      if (this.settings.enabled()) {
        // The password may be new, or the saved one was dropped by a Face ID change
        await this.save(account, password);
        return false;
      }
      return this.settings.declinedBy() !== account;
    } catch (error) {
      // Signing in worked; Face ID is only a convenience
      console.error('Failed to update the saved sign-in:', error);
      return false;
    }
  }

  /** Turns Face ID on and saves the password. Rejects if it can't be saved. */
  async accept(email: string, password: string): Promise<void> {
    const account = normalize(email);
    await this.save(account, password);
    await this.settings.update({ enabled: true, email: account, declinedBy: null });
  }

  async decline(email: string): Promise<void> {
    await this.settings.update({ declinedBy: normalize(email) });
  }

  /** From the header, where the password isn't known: it is saved at the next password sign-in */
  async enable(): Promise<void> {
    const email = this.authService.currentUser()?.email;
    if (!this.nameSignal() || !email) return;
    if (!(await this.confirm('Turn on the app lock'))) return;
    await this.settings.update({ enabled: true, email: normalize(email), declinedBy: null });
  }

  async disable(): Promise<void> {
    if (!(await this.confirm('Turn off the app lock'))) return;
    await this.turnOff();
  }

  async signIn(): Promise<BiometricSignIn> {
    let email: string;
    let password: string;
    this.authService.clearError();
    try {
      ({ email, password } = await this.biometrics.readCredentials('Sign in to Euro Coins'));
    } catch (error) {
      const reason = error instanceof BiometricError ? error.reason : 'failed';
      if (reason === 'cancelled') return 'cancelled';
      if (reason !== 'not-found') return 'failed';
      await this.forget();
      return 'outdated';
    }

    if (await this.authService.login(email, password)) return 'signed-in';
    if (this.authService.authError()?.code !== 'invalid_credentials') return 'error';
    this.authService.clearError();
    await this.forget();
    return 'outdated';
  }

  private async save(email: string, password: string): Promise<void> {
    await this.biometrics.saveCredentials({ email, password });
    this.hasSavedSignal.set(true);
  }

  private async forget(): Promise<void> {
    this.hasSavedSignal.set(false);
    try {
      await this.biometrics.removeCredentials();
    } catch (error) {
      console.error('Failed to remove the saved sign-in:', error);
    }
  }

  private async turnOff(): Promise<void> {
    await this.forget();
    await this.settings.update({ enabled: false, email: null, declinedBy: null });
  }

  private async confirm(reason: string): Promise<boolean> {
    try {
      await this.biometrics.verify(reason);
      return true;
    } catch {
      return false;
    }
  }
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}
