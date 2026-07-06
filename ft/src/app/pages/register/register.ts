import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    otpCode: ['', [Validators.pattern(/^\d{6}$/)]]
  });

  step: 'register' | 'otp' = 'register';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resendCountdown = 0;
  resendInterval: any;

  ngOnInit() {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.step === 'register') {
      const nameControl = this.registerForm.get('name');
      const emailControl = this.registerForm.get('email');
      const passwordControl = this.registerForm.get('password');

      if (!nameControl || nameControl.invalid || !emailControl || emailControl.invalid || !passwordControl || passwordControl.invalid) {
        nameControl?.markAsTouched();
        emailControl?.markAsTouched();
        passwordControl?.markAsTouched();
        return;
      }

      this.isLoading = true;
      const { name, email, password } = this.registerForm.value;

      this.authService.register(name, email, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.step = 'otp';
          this.successMessage = 'Código enviado para o e-mail';
          this.startCountdown();
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 422 && err.error?.errors?.email) {
            this.errorMessage = 'Este e-mail já está cadastrado. Por favor, faça login ou use outro.';
          } else {
            this.errorMessage = err.error?.mensagem || 'Falha ao registrar. Tente novamente.';
          }
        }
      });
    } else {
      const codeControl = this.registerForm.get('otpCode');
      if (!codeControl || codeControl.invalid || !codeControl.value) {
        codeControl?.markAsTouched();
        if (!codeControl?.value) {
          this.errorMessage = 'Por favor, insira o código de 6 dígitos.';
        }
        return;
      }

      this.isLoading = true;
      const { email, otpCode } = this.registerForm.value;

      this.authService.verifyOtp(email, otpCode).subscribe({
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
    this.successMessage = '';
    this.isLoading = true;
    const email = this.registerForm.get('email')?.value;

    this.authService.sendOtp(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Código enviado para o e-mail';
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.mensagem || 'Erro ao reenviar o código. Tente novamente.';
      }
    });
  }

  changeEmail() {
    this.step = 'register';
    this.errorMessage = '';
    this.successMessage = '';
    this.registerForm.get('otpCode')?.reset();
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
