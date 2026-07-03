import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../services/notification';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  const user = authService.getUserData();

  if (user && !!user.is_admin) {
    return true;
  }

  notification.error('Acesso restrito a administradores.');
  router.navigate(['/tarefas']);
  return false;
};