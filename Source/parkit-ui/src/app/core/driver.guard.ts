import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './models';

export const driverGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()?.role === UserRole.Driver) return true;

  if (auth.user()?.role === UserRole.Owner) {
    router.navigate(['/owner/facilities']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
