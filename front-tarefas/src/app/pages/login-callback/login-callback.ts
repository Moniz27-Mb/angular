import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login-callback',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <div class="spinner"></div>
      <h3 style="margin-top: 20px; color: #4F46E5;">Autenticando...</h3>
      <p style="color: #666;">Aguarde enquanto configuramos a sua sessão.</p>
    </div>
  `,
  styles: `
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border-left-color: #4F46E5;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
})
export class LoginCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (error) {
        this.router.navigate(['/login'], { queryParams: { error } });
        return;
      }

      if (token) {
        this.authService.handleSocialLogin(token).subscribe({
          next: (user) => {
            if (user && user.is_admin) {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/tarefas']);
            }
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }
}
