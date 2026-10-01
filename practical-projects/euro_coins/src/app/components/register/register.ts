import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  protected readonly email = signal('');
  protected readonly displayName = signal('');
  protected readonly phone = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly localError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly authError = this.authService.authError;

  protected async onSubmit(): Promise<void> {
    this.localError.set(null);
    this.successMessage.set(null);
    this.authService.clearError();

    if (!this.displayName().trim()) {
      this.localError.set('Display name is required.');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.localError.set('Passwords do not match.');
      return;
    }
    if (this.password().length < 6) {
      this.localError.set('Password must be at least 6 characters.');
      return;
    }

    this.isSubmitting.set(true);
    const email = this.email().trim();
    const success = await this.authService.createUser({
      email,
      password: this.password(),
      displayName: this.displayName().trim(),
      phone: this.phone().trim() || null,
    });
    this.isSubmitting.set(false);

    if (success) {
      this.successMessage.set(`User ${email} was created.`);
      this.email.set('');
      this.displayName.set('');
      this.phone.set('');
      this.password.set('');
      this.confirmPassword.set('');
    }
  }
}
