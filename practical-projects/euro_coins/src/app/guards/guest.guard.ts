import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(checkInterval);
          if (authService.isAuthenticated()) {
            router.navigate(['/collection']);
            resolve(false);
          } else {
            resolve(true);
          }
        }
      }, 50);
    });
  }

  if (authService.isAuthenticated()) {
    router.navigate(['/collection']);
    return false;
  }

  return true;
};
