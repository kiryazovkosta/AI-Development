import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BiometricLoginService } from '../../services/biometric-login.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected readonly biometricLogin = inject(BiometricLoginService);
  protected readonly togglingFaceId = signal(false);

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) void this.biometricLogin.refresh();
    });
  }

  protected async onToggleFaceId(): Promise<void> {
    this.togglingFaceId.set(true);
    try {
      await (this.biometricLogin.enabled()
        ? this.biometricLogin.disable()
        : this.biometricLogin.enable());
    } catch (error) {
      console.error('Failed to change the Face ID setting:', error);
    } finally {
      this.togglingFaceId.set(false);
    }
  }

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
