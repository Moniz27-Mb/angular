import { Component, OnInit, OnDestroy, inject, ElementRef, QueryList, ViewChildren } from '@angular/core';
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

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  loginForm: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    otpCode:  ['', [Validators.pattern(/^\d{6}$/)]],
    password: ['', []]
  });

  /** 'otp' = fluxo passwordless (padrão), 'password' = login tradicional por senha */
  loginMode: 'otp' | 'password' = 'password';
  step: 'email' | 'otp' = 'email';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resendCountdown = 0;
  resendInterval: any;

  /** Controlo de visibilidade da senha */
  showPassword = false;

  /** Dígitos individuais do OTP */
  otpDigits: string[] = ['', '', '', '', '', ''];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'social_auth_failed') {
        this.errorMessage = 'A autenticação com o Google falhou. Tente novamente.';
      }
    });
  }

  /** Processa input nas caixas OTP e avança automaticamente */
  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.otpDigits[index] = value.slice(0, 1);
    input.value = this.otpDigits[index];

    // Sincroniza com o formControl
    const combined = this.otpDigits.join('');
    this.loginForm.get('otpCode')?.setValue(combined);

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
        this.loginForm.get('otpCode')?.setValue(this.otpDigits.join(''));
        const prev = this.otpBoxes.toArray()[index - 1];
        prev?.nativeElement.focus();
      } else {
        this.otpDigits[index] = '';
        this.loginForm.get('otpCode')?.setValue(this.otpDigits.join(''));
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
    this.loginForm.get('otpCode')?.setValue(this.otpDigits.join(''));
    const lastFilled = Math.min(pasted.length, 5);
    setTimeout(() => {
      this.otpBoxes.toArray()[lastFilled]?.nativeElement.focus();
    });
  }

  /** Limpa os dígitos OTP */
  clearOtpDigits() {
    this.otpDigits = ['', '', '', '', '', ''];
    this.loginForm.get('otpCode')?.setValue('');
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Ramo de login por senha
    if (this.loginMode === 'password') {
      this.submitPasswordLogin();
      return;
    }

    // Ramo OTP - Step 1: enviar e-mail
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
          this.successMessage = 'Código enviado para o e-mail';
          this.startCountdown();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.mensagem || 'Erro ao enviar o código. Tente novamente.';
        }
      });

    // Ramo OTP - Step 2: verificar código
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
      const code  = codeControl.value;

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

  /** Login tradicional via bcrypt */
  submitPasswordLogin() {
    const emailControl    = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    let hasError = false;
    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      hasError = true;
    }
    if (!passwordControl?.value) {
      passwordControl?.markAsTouched();
      this.errorMessage = 'A senha é obrigatória.';
      hasError = true;
    }
    if (hasError) return;

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

  /** Alterna entre fluxo OTP e fluxo por senha */
  toggleLoginMode(mode: 'otp' | 'password') {
    this.loginMode = mode;
    this.step = 'email';
    this.errorMessage = '';
    this.successMessage = '';
    this.clearOtpDigits();
    this.loginForm.get('password')?.reset();
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendCountdown = 0;
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
    const email = this.loginForm.get('email')?.value;

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
    this.step = 'email';
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
