import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AppLockService } from '../../services/native/app-lock.service';

/**
 * Covers the app while it is locked. A modal <dialog>, because only that goes above an open
 * coin dialog and makes everything behind it unreachable.
 */
@Component({
  selector: 'app-lock-screen',
  standalone: true,
  templateUrl: './lock-screen.html',
  styleUrl: './lock-screen.css',
})
export class LockScreenComponent {
  private readonly authService = inject(AuthService);
  protected readonly appLock = inject(AppLockService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly signingOut = signal(false);

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.appLock.locked()) {
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  /** The browser may close a dialog despite a cancelled "cancel" event */
  protected onClose(): void {
    if (this.appLock.locked()) this.dialog().nativeElement.showModal();
  }

  protected async usePassword(): Promise<void> {
    this.signingOut.set(true);
    try {
      await this.authService.signOutLocal();
    } catch (error) {
      // Stays locked rather than showing a half signed-out app
      console.error('Failed to leave the lock screen:', error);
    } finally {
      this.signingOut.set(false);
    }
  }
}
