import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUserData();
  console.log('adminGuard — user:', user); // debug

  if (user && !!user.is_admin) {
    return true;
  }

  router.navigate(['/tarefas']);
  return false;
};