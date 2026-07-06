import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
export class Login implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otpCode: ['', [Validators.pattern(/^\d{6}$/)]]
  });

  step: 'email' | 'otp' = 'email';
  isLoading = false;
  errorMessage = '';
  resendCountdown = 0;
  resendInterval: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'social_auth_failed') {
        this.errorMessage = 'A autenticação com o Google falhou. Tente novamente.';
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.step === 'email') {
      const emailControl = this.loginForm.get('email');
      if (!emailControl || emailControl.invalid) {
        emailControl?.markAsTouched();
        return;
      }

      this.isLoading = true;
      const email = emailControl.value;

      this.authService.sendOtp(email).subscribe({
        next: () => {
          this.isLoading = false;
          this.step = 'otp';
          this.startCountdown();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.mensagem || 'Erro ao enviar o código. Tente novamente.';
        }
      });
    } else {
      const codeControl = this.loginForm.get('otpCode');
      if (!codeControl || codeControl.invalid || !codeControl.value) {
        codeControl?.markAsTouched();
        if (!codeControl?.value) {
          this.errorMessage = 'Por favor, insira o código de 6 dígitos.';
        }
        return;
      }

      this.isLoading = true;
      const email = this.loginForm.get('email')?.value;
      const code = codeControl.value;

      this.authService.verifyOtp(email, code).subscribe({
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
          this.errorMessage = err.error?.mensagem || 'Código inválido ou expirado.';
        }
      });
    }
  }

  startCountdown() {
    this.resendCountdown = 60;
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  resendOtp() {
    if (this.resendCountdown > 0 || this.isLoading) return;
    this.errorMessage = '';
    this.isLoading = true;
    const email = this.loginForm.get('email')?.value;

    this.authService.sendOtp(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.mensagem || 'Erro ao reenviar o código. Tente novamente.';
      }
    });
  }

  changeEmail() {
    this.step = 'email';
    this.errorMessage = '';
    this.loginForm.get('otpCode')?.reset();
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendCountdown = 0;
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }
}
