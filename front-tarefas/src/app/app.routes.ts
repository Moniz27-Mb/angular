import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Perfil } from './pages/perfil/perfil';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'tarefas', component: Dashboard, canActivate: [authGuard] },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboard, canActivate: [authGuard, adminGuard] },
  { path: '', redirectTo: '/tarefas', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
