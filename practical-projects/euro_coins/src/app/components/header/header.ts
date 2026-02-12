import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
