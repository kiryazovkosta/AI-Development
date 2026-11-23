import { Injectable, computed, inject, signal } from '@angular/core';
import { FaceIdSettingsService } from './face-id-settings.service';
import { AppLifecycle, BiometricError, Biometrics, NativePlatform } from './native-adapters';

/** Coming back sooner than this doesn't ask for Face ID again */
export const LOCK_AFTER_MS = 60_000;

/**
 * Locks the native app behind Face ID (or the device passcode) when it starts, and when it
 * comes back after LOCK_AFTER_MS in the background. Does nothing in a browser.
 *
 * Must not depend on AuthService: the session is only read once this has unlocked.
 */
@Injectable({ providedIn: 'root' })
export class AppLockService {
  private readonly platform = inject(NativePlatform);
  private readonly settings = inject(FaceIdSettingsService);
  private readonly lifecycle = inject(AppLifecycle);
  private readonly biometrics = inject(Biometrics);

  private readonly lockedSignal = signal(false);
  private readonly promptingSignal = signal(false);
  private readonly messageSignal = signal<string | null>(null);

  readonly locked = this.lockedSignal.asReadonly();
  readonly prompting = this.promptingSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();

  private active = true;
  /** iOS refuses to show Face ID until the app is active again */
  private promptWhenActive = false;
  private pausedAt: number | null = null;
  /** Answers the session read that waits for the first unlock: true to go on, false to discard */
  private startGate: ((unlocked: boolean) => void) | null = null;

  private readonly canLock = computed(
    () => this.platform.isNative && this.settings.enabled() && !this.settings.signedOut()
  );

  constructor() {
    if (!this.platform.isNative) return;
    this.lifecycle.onPause(() => this.onPause());
    this.lifecycle.onResume(() => this.onResume());
    this.lifecycle.onActiveChange((isActive) => this.onActiveChange(isActive));
  }

  /** Resolves to true when the stored session may be read, or false if it is to be discarded */
  async waitAtStart(): Promise<boolean> {
    await this.settings.ready();
    if (!this.canLock()) return true;
    this.active = await this.lifecycle.isActive().catch(() => true);
    return new Promise((resolve) => {
      this.startGate = resolve;
      this.lock();
    });
  }

  async unlock(): Promise<void> {
    if (!this.lockedSignal() || this.promptingSignal()) return;
    this.promptingSignal.set(true);
    this.messageSignal.set(null);
    try {
      await this.biometrics.verify('Unlock your coin collection');
      this.release(true);
    } catch (error) {
      // Stays locked. Only the user asks again, so a failing check can never loop.
      const reason = error instanceof BiometricError ? error.reason : 'failed';
      if (reason === 'failed') this.messageSignal.set("That didn't work. Try again.");
      if (reason === 'unavailable') {
        this.messageSignal.set(
          'This device has no Face ID or passcode set up. Sign in with your password.'
        );
      }
    } finally {
      this.promptingSignal.set(false);
    }
  }

  /** Lets a session read that is still waiting for the first unlock end without a session */
  discardAtStart(): void {
    this.startGate?.(false);
    this.startGate = null;
  }

  /** Removes the lock screen. Call with false only after the session is gone. */
  release(unlocked: boolean): void {
    this.startGate?.(unlocked);
    this.startGate = null;
    this.promptWhenActive = false;
    this.pausedAt = null;
    this.messageSignal.set(null);
    this.lockedSignal.set(false);
  }

  private lock(): void {
    this.messageSignal.set(null);
    this.lockedSignal.set(true);
    if (this.active) {
      void this.unlock();
    } else {
      this.promptWhenActive = true;
    }
  }

  private onPause(): void {
    // On Android the prompt is its own screen, which pauses the app
    if (this.promptingSignal()) return;
    this.pausedAt = Date.now();
  }

  private onResume(): void {
    if (this.pausedAt === null) return;
    const away = Date.now() - this.pausedAt;
    this.pausedAt = null;
    if (!this.canLock()) return;
    // Negative when the clock was set back while away
    if (this.lockedSignal() || away >= LOCK_AFTER_MS || away < 0) this.lock();
  }

  private onActiveChange(isActive: boolean): void {
    this.active = isActive;
    if (isActive && this.promptWhenActive) {
      this.promptWhenActive = false;
      void this.unlock();
    }
  }
}
