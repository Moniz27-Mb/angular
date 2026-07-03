import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: sans-serif;">
      <div class="spinner" style="border: 4px solid rgba(0,0,0,0.1); border-left-color: #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
      <h2 style="margin-top: 20px; color: #333;">Autenticando...</h2>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    </div>
  `,
})
export class AuthCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const userEncoded = params['user'];

      if (token && userEncoded) {
        try {
          // Descodifica o Base64 com suporte seguro a caracteres UTF-8 (acentos, cedilhas, etc)
          const decodedString = decodeURIComponent(escape(atob(userEncoded)));
          const user = JSON.parse(decodedString);
          this.authService.setSession(token, user);
          this.router.navigate(['/tarefas']);
        } catch (e) {
          console.error('Erro ao processar dados de login', e);
          this.router.navigate(['/login']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
