import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InstallAppComponent } from '../install-app/install-app';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, InstallAppComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
  }
}
