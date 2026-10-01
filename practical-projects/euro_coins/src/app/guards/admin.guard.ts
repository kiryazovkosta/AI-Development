import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const check = (): boolean => {
    if (authService.isAuthenticated() && authService.isAdmin()) {
      return true;
    }
    router.navigate(['/collection']);
    return false;
  };

  if (authService.isLoading()) {
    return new Promise<boolean>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!authService.isLoading()) {
          clearInterval(checkInterval);
          resolve(check());
        }
      }, 50);
    });
  }

  return check();
};
