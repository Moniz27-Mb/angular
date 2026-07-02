import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification';
import { SidebarComponent } from '../../components/sidebar/sidebar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SidebarComponent],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  user: any;
  isSavingProfile = false;
  isSavingPassword = false;
  isUploadingAvatar = false;

  profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm: FormGroup = this.fb.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    password_confirmation: ['', Validators.required],
  }, { validator: this.passwordMatchValidator });

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.isUploadingAvatar = true;
      this.authService.uploadAvatar(file).subscribe({
        next: () => {
          this.isUploadingAvatar = false;
          this.notification.success('Foto de perfil atualizada!');
        },
        error: (err) => {
          this.isUploadingAvatar = false;
          this.notification.error('Erro ao atualizar foto: ' + (err.error?.mensagem || err.message));
        }
      });
    }
  }

  getAvatarUrl() {
    if (!this.user?.avatar) return null;
    return this.user.avatar.startsWith('data:image') 
      ? this.user.avatar 
      : `${environment.apiUrl.replace('/api', '')}/storage/${this.user.avatar}`;
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('password_confirmation')?.value
      ? null : { mismatch: true };
  }

  saveProfile() {
    if (this.profileForm.invalid || this.isSavingProfile) return;

    this.isSavingProfile = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.notification.success('Perfil atualizado com sucesso!');
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.notification.error('Erro ao atualizar perfil: ' + (err.error?.mensagem || err.message));
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid || this.isSavingPassword) return;

    this.isSavingPassword = true;
    this.authService.updateProfile(this.passwordForm.value).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.passwordForm.reset();
        this.notification.success('Senha alterada com sucesso!');
      },
      error: (err) => {
        this.isSavingPassword = false;
        this.notification.error('Erro ao alterar senha: ' + (err.error?.mensagem || err.message));
      }
    });
  }

  voltar() {
    if (this.user?.is_admin) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/tarefas']);
    }
  }
}
