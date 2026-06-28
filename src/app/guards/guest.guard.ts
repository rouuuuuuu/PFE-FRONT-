import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // If already logged in, redirect to dashboard
    router.navigate(['/']);
    return false;
  }

  // Not logged in, allow access to login page
  return true;
};
