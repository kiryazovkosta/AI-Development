import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly localError = signal<string | null>(null);
  protected readonly authError = this.authService.authError;
  protected readonly isLoading = this.authService.isLoading;

  protected async onSubmit(): Promise<void> {
    this.localError.set(null);
    this.authService.clearError();

    if (this.password() !== this.confirmPassword()) {
      this.localError.set('Passwords do not match.');
      return;
    }
    if (this.password().length < 6) {
      this.localError.set('Password must be at least 6 characters.');
      return;
    }

    const success = await this.authService.register(this.email(), this.password());
    if (success) {
      this.router.navigate(['/collection']);
    }
  }
}
