import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-install-app',
  standalone: true,
  templateUrl: './install-app.html',
  styleUrl: './install-app.css',
  host: { '(document:keydown.escape)': 'showIosHelp.set(false)' },
})
export class InstallAppComponent {
  protected readonly authService = inject(AuthService);
  protected readonly pwa = inject(PwaInstallService);
  protected readonly showIosHelp = signal(false);

  protected async onInstall(): Promise<void> {
    if (this.pwa.canPrompt()) {
      await this.pwa.promptInstall();
    } else if (this.pwa.isIos) {
      this.showIosHelp.update((open) => !open);
    }
  }
}
