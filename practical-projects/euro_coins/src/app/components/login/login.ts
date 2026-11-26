import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricLoginService } from '../../services/biometric-login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly biometricLogin = inject(BiometricLoginService);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly authError = this.authService.authError;
  protected readonly isLoading = this.authService.isLoading;
  protected readonly biometricMessage = signal<string | null>(null);
  protected readonly busy = signal(false);

  /** Signed in with these; asking whether to use Face ID from now on */
  protected readonly offer = signal<{ email: string; password: string } | null>(null);

  constructor() {
    void this.biometricLogin.refresh();
    // Signing out from the menu while the question is open returns to the form
    effect(() => {
      if (!this.authService.isAuthenticated()) this.offer.set(null);
    });
  }

  protected async onSubmit(): Promise<void> {
    this.biometricMessage.set(null);
    const email = this.email();
    const password = this.password();
    if (!(await this.authService.login(email, password))) return;

    if (await this.biometricLogin.onPasswordSignIn(email, password)) {
      this.password.set('');
      this.offer.set({ email, password });
    } else {
      this.router.navigate(['/collection']);
    }
  }

  protected async onBiometricSignIn(): Promise<void> {
    this.biometricMessage.set(null);
    this.busy.set(true);
    const name = this.biometricLogin.name();
    try {
      switch (await this.biometricLogin.signIn()) {
        case 'signed-in':
          this.router.navigate(['/collection']);
          break;
        case 'outdated':
          this.biometricMessage.set(
            'Your saved sign-in no longer works. Sign in with your password.'
          );
          break;
        case 'failed':
          this.biometricMessage.set(`${name} didn't work. Sign in with your password.`);
          break;
      }
    } finally {
      this.busy.set(false);
    }
  }

  protected async acceptOffer(): Promise<void> {
    const offer = this.offer();
    if (!offer) return;
    this.biometricMessage.set(null);
    this.busy.set(true);
    try {
      await this.biometricLogin.accept(offer.email, offer.password);
      this.finishOffer();
    } catch (error) {
      console.error('Failed to save the sign-in:', error);
      this.biometricMessage.set("Couldn't save your sign-in. Try again, or choose Not now.");
    } finally {
      this.busy.set(false);
    }
  }

  protected async declineOffer(): Promise<void> {
    const offer = this.offer();
    if (!offer) return;
    try {
      await this.biometricLogin.decline(offer.email);
    } catch (error) {
      console.error('Failed to remember the answer:', error);
    }
    this.finishOffer();
  }

  private finishOffer(): void {
    this.offer.set(null);
    this.router.navigate(['/collection']);
  }
}
