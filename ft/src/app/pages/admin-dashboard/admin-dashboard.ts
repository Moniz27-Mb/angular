import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification';
import { AuthService } from '../../services/auth';
import { SidebarComponent } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, SidebarComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  stats: any = null;
  users: any[] = [];
  isLoading = true;
  activeMenu = 'overview';

  trashedUsers: any[] = [];
  isLoadingTrashedUsers = false;

  searchTerm: string = '';

  get filteredUsers() {
    let list = [...this.users];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(term) || 
        u.email.toLowerCase().includes(term)
      );
    }
    return list;
  }

  // Mock data for charts
  workflowData = [25, 45, 35, 60, 40, 55, 75, 50, 70, 65, 80, 95];
  marketingData = [40, 60, 45, 80, 50, 90, 70, 85, 60, 95, 75, 100];

  // New User Form
  showUserForm = false;
  isSavingUser = false;
  userForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    is_admin: [false]
  });

  // User Tasks View
  selectedUserTasks: any[] = [];
  selectedUserName: string = '';
  showTasksModal = false;
  isLoadingTasks = false;

  // Delete User Modal
  showDeleteUserModal = false;
  userToDeleteId: number | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeMenu = params['tab'];
        if (this.activeMenu === 'users') {
          this.loadTrashedUsers();
        }
      }
    });

    this.loadData();
  }

 loadData() {
  this.isLoading = true;
  
  forkJoin({
    stats: this.adminService.getStats(),
    users: this.adminService.getUsers()
  }).pipe(
    finalize(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
    })
  ).subscribe({
    next: (res) => {
      this.stats = res.stats.stats;
      this.users = res.users.users;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erro ao carregar dados do admin', err);
      this.notification.error('Erro ao carregar dados administrativos.');
      
      if (err.status === 401 || err.status === 403) {
        setTimeout(() => {
          this.authService.clearSession();
          this.router.navigate(['/login']);
        }, 100);
      }
    }
  });
}

  toggleUserForm() {
    this.showUserForm = !this.showUserForm;
    if (!this.showUserForm) this.userForm.reset({ is_admin: false });
  }

  createUser() {
    if (this.userForm.invalid || this.isSavingUser) return;

    this.isSavingUser = true;
    this.adminService.createUser(this.userForm.value).subscribe({
      next: () => {
        this.isSavingUser = false;
        this.toggleUserForm();
        this.loadData();
        this.notification.success('Usuário criado com sucesso!');
      },
      error: (err) => {
        this.isSavingUser = false;
        this.notification.error('Erro ao criar usuário: ' + (err.error?.mensagem || err.message));
      }
    });
  }

  viewUserTasks(user: any) {
    this.selectedUserName = user.name;
    this.showTasksModal = true;
    this.isLoadingTasks = true;
    this.selectedUserTasks = [];

    this.adminService.getUserTasks(user.id).subscribe({
      next: (res) => {
        this.selectedUserTasks = res.tarefas;
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar tarefas do usuário', err);
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeTasksModal() {
    this.showTasksModal = false;
    this.selectedUserTasks = [];
    this.selectedUserName = '';
  }

  confirmarExclusaoUsuario(id: number) {
    this.userToDeleteId = id;
    this.showDeleteUserModal = true;
  }

  cancelarExclusaoUsuario() {
    this.showDeleteUserModal = false;
    this.userToDeleteId = null;
  }

  excluirUsuario() {
    if (!this.userToDeleteId) return;
    const id = this.userToDeleteId;
    this.showDeleteUserModal = false;
    this.userToDeleteId = null;

    this.adminService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.loadData();
        this.notification.success('Usuário removido com sucesso.');
      },
      error: (err) => {
        this.notification.error('Erro ao excluir usuário: ' + (err.error?.mensagem || err.message));
      }
    });
  }

  alternarAdmin(id: number) {
    this.adminService.toggleAdmin(id).subscribe({
      next: (res) => {
        this.notification.success(res.mensagem);
        this.loadData();
      },
      error: (err) => {
        this.notification.error('Erro ao alterar privilégios: ' + (err.error?.mensagem || err.message));
      }
    });
  }

  showTrashedSection = false;

  toggleTrashedSection() {
    this.showTrashedSection = !this.showTrashedSection;
    if (this.showTrashedSection) {
      this.loadTrashedUsers();
    }
  }

  loadTrashedUsers() {
    this.isLoadingTrashedUsers = true;
    this.adminService.getTrashedUsers().subscribe({
      next: (res) => {
        this.trashedUsers = res.users;
        this.isLoadingTrashedUsers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar lixeira de usuarios', err);
        this.isLoadingTrashedUsers = false;
        this.cdr.detectChanges();
      }
    });
  }

  restaurarUsuario(id: number) {
    this.adminService.restoreUser(id).subscribe({
      next: () => {
        this.trashedUsers = this.trashedUsers.filter(u => u.id !== id);
        this.loadData();
        this.notification.success('Usuário restaurado com sucesso!');
      },
      error: (err) => {
        this.notification.error('Erro ao restaurar: ' + (err.error?.mensagem || err.message));
      }
    });
  }

  forceDeleteUser(id: number) {
    if(confirm('Tem a certeza absoluta? Esta ação não pode ser desfeita e removerá todos os dados do utilizador.')) {
      this.adminService.forceDeleteUser(id).subscribe({
        next: () => {
          this.trashedUsers = this.trashedUsers.filter(u => u.id !== id);
          this.notification.success('Usuário apagado definitivamente!');
        },
        error: (err) => {
          this.notification.error('Erro ao apagar: ' + (err.error?.mensagem || err.message));
        }
      });
    }
  }

  goPerfil() {
    this.router.navigate(['/perfil']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  voltar() {
    this.router.navigate(['/tarefas']);
  }
}
