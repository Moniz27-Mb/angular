import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  /** Controlo de visibilidade da senha */
  showPassword = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'social_auth_failed') {
        this.errorMessage = 'A autenticação com o Google falhou. Tente novamente.';
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    const emailControl    = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    if (this.loginForm.invalid) {
      emailControl?.markAsTouched();
      passwordControl?.markAsTouched();
      return;
    }

    this.isLoading = true;
    const email    = emailControl!.value;
    const password = passwordControl!.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.user && res.user.is_admin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/tarefas']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.mensagem || 'Credenciais inválidas. Verifique o e-mail e a senha.';
      }
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}
