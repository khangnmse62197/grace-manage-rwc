import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from './auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated and is admin
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Redirect to home if not admin or not authenticated
  router.navigate(['/home']);
  return false;
};
