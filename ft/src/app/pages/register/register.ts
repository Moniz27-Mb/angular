import { Component, OnInit, OnDestroy, inject, ElementRef, QueryList, ViewChildren } from '@angular/core';
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

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

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

  /** Controlo de visibilidade da senha */
  showPassword = false;

  /** Dígitos individuais do OTP */
  otpDigits: string[] = ['', '', '', '', '', ''];

  ngOnInit() {}

  /** Processa input nas caixas OTP e avança automaticamente */
  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.otpDigits[index] = value.slice(0, 1);
    input.value = this.otpDigits[index];

    // Sincroniza com o formControl
    const combined = this.otpDigits.join('');
    this.registerForm.get('otpCode')?.setValue(combined);

    // Avança para o próximo campo
    if (value && index < 5) {
      const next = this.otpBoxes.toArray()[index + 1];
      next?.nativeElement.focus();
    }
  }

  /** Retrocede ao apagar com Backspace */
  onOtpKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        this.otpDigits[index - 1] = '';
        this.registerForm.get('otpCode')?.setValue(this.otpDigits.join(''));
        const prev = this.otpBoxes.toArray()[index - 1];
        prev?.nativeElement.focus();
      } else {
        this.otpDigits[index] = '';
        this.registerForm.get('otpCode')?.setValue(this.otpDigits.join(''));
      }
    }
  }

  /** Suporte a colar o código de uma vez */
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) || '';
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = pasted[i] || '';
    }
    this.registerForm.get('otpCode')?.setValue(this.otpDigits.join(''));
    const lastFilled = Math.min(pasted.length, 5);
    setTimeout(() => {
      this.otpBoxes.toArray()[lastFilled]?.nativeElement.focus();
    });
  }

  /** Limpa os dígitos OTP */
  clearOtpDigits() {
    this.otpDigits = ['', '', '', '', '', ''];
    this.registerForm.get('otpCode')?.setValue('');
  }

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
        this.successMessage = 'Código reenviado para o e-mail';
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
    this.clearOtpDigits();
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
