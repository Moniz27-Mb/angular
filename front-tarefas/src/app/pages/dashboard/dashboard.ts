import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TarefasService, Tarefa } from '../../services/tarefas';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { NotificationService } from '../../core/services/notification';
import { SidebarComponent } from '../../components/sidebar/sidebar';

export function dataPassadaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  
  // Set selected date time to 00:00:00 for accurate day comparison
  const selectedDate = new Date(control.value);
  selectedDate.setHours(0, 0, 0, 0);

  // Set current date time to 00:00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { dataPassada: true };
  }
  return null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private tarefasService = inject(TarefasService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  tarefas: Tarefa[] = [];
  isLoading = true;
  isSaving = false;
  user: any;
  searchTerm: string = '';

  showTrashed = false;
  trashedTarefas: Tarefa[] = [];
  isLoadingTrashed = false;

  // Filters & Sorting
  currentFilter: 'all' | 'pending' | 'completed' = 'all';
  sortBy: 'date' | 'priority' | 'newest' = 'newest';

  // Modal confirmation
  showDeleteModal = false;
  tarefaToDelete: number | null = null;

  // Form state
  isFormOpen = false;
  editingTarefaId: number | null = null;
  currentYear = new Date().getFullYear();
  get minDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  tarefaForm: FormGroup = this.fb.group({
    titulo: ['', Validators.required],
    descricao: [''],
    prioridade: ['baixa'],
    data_vencimento: ['', [Validators.required, dataPassadaValidator]]
  });

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
    this.loadTarefas();
  }

  // Getters for statistics
  get stats() {
    return {
      total: this.tarefas.length,
      pending: this.tarefas.filter(t => !t.concluida).length,
      completed: this.tarefas.filter(t => t.concluida).length
    };
  }

  // Getter for filtered and sorted list
  get filteredTarefas() {
    let list = [...this.tarefas];

    // Filter by status
    if (this.currentFilter === 'pending') {
      list = list.filter(t => !t.concluida);
    } else if (this.currentFilter === 'completed') {
      list = list.filter(t => t.concluida);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(t => 
        t.titulo.toLowerCase().includes(term) || 
        (t.descricao && t.descricao.toLowerCase().includes(term))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (this.sortBy === 'date') {
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      } else if (this.sortBy === 'priority') {
        const priorityMap = { 'alta': 0, 'media': 1, 'baixa': 2 };
        const pA = priorityMap[a.prioridade || 'baixa'];
        const pB = priorityMap[b.prioridade || 'baixa'];
        return pA - pB;
      } else {
        // newest
        return b.id - a.id;
      }
    });

    return list;
  }

  setFilter(filter: 'all' | 'pending' | 'completed') {
    this.currentFilter = filter;
  }

  setSort(sort: 'date' | 'priority' | 'newest') {
    this.sortBy = sort;
  }

  isOverdue(date: string | undefined): boolean {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    return dueDate < today;
  }

  loadTarefas() {
    this.isLoading = true;
    this.tarefasService.getTarefas().subscribe({
      next: (data) => {
        this.tarefas = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar tarefas', err);
        this.notification.error('Erro ao carregar tarefas: ' + (err.error?.message || err.message));
        this.isLoading = false;
        this.cdr.detectChanges();
        if (err.status === 401) {
            this.logout();
        }
      }
    });
  }

  toggleForm() {
    this.isFormOpen = !this.isFormOpen;
    if (!this.isFormOpen) {
      this.tarefaForm.reset();
      this.editingTarefaId = null;
    }
  }

  editarTarefa(tarefa: Tarefa) {
    this.editingTarefaId = tarefa.id;
    this.tarefaForm.patchValue({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      prioridade: tarefa.prioridade || 'baixa',
      data_vencimento: tarefa.data_vencimento
    });
    this.isFormOpen = true;
  }

  salvarTarefa() {
    if (this.tarefaForm.invalid || this.isSaving) return;

    this.isSaving = true;
    const dadosTarefa = {
      titulo: this.tarefaForm.value.titulo,
      descricao: this.tarefaForm.value.descricao,
      prioridade: this.tarefaForm.value.prioridade,
      data_vencimento: this.tarefaForm.value.data_vencimento || null,
    };

    if (this.editingTarefaId) {
      // Update
      this.tarefasService.updateTarefa(this.editingTarefaId, dadosTarefa).subscribe({
        next: (updated) => {
          const index = this.tarefas.findIndex(t => t.id === this.editingTarefaId);
          if (index !== -1) {
            this.tarefas[index] = updated;
          }
          this.isSaving = false;
          this.toggleForm();
          this.notification.success('Tarefa atualizada com sucesso!');
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Erro ao atualizar tarefa', err);
          this.notification.error('Erro ao atualizar: ' + (err.error?.message || err.message));
        }
      });
    } else {
      // Create
      const novaTarefa = { ...dadosTarefa, concluida: false };
      this.tarefasService.createTarefa(novaTarefa).subscribe({
        next: (tarefa) => {
          this.tarefas.unshift(tarefa);
          this.isSaving = false;
          this.toggleForm();
          this.notification.success('Tarefa criada com sucesso!');
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Erro ao criar tarefa', err);
          this.notification.error('Erro ao salvar: ' + (err.error?.message || err.message));
          if (err.status === 401) {
              this.logout();
          }
        }
      });
    }
  }

  concluirTarefa(tarefa: Tarefa) {
    const originalStatus = tarefa.concluida;
    tarefa.concluida = !originalStatus; // Atualiza instantaneamente
    
    this.tarefasService.updateTarefa(tarefa.id, { concluida: tarefa.concluida }).subscribe({
      next: (updated) => {
        // Sincroniza com dados do servidor
        Object.assign(tarefa, updated);
        this.notification.success(tarefa.concluida ? 'Tarefa concluída! ' : 'Tarefa reaberta.');
      },
      error: (err) => {
        tarefa.concluida = originalStatus; // Reverte em caso de erro
        console.error('Erro ao atualizar tarefa', err);
        this.notification.error('Não foi possível atualizar a tarefa.');
      }
    });
  }

  confirmarExclusao(id: number) {
    this.tarefaToDelete = id;
    this.showDeleteModal = true;
  }

  cancelarExclusao() {
    this.showDeleteModal = false;
    this.tarefaToDelete = null;
  }

  excluirTarefa() {
    if (!this.tarefaToDelete) return;
    
    const id = this.tarefaToDelete;
    const originalTarefas = [...this.tarefas];
    this.tarefas = this.tarefas.filter(t => t.id !== id); // Remove instantaneamente
    this.showDeleteModal = false;
    this.tarefaToDelete = null;
    
    this.tarefasService.deleteTarefa(id).subscribe({
      next: () => {
        // Confirmado pelo servidor
      },
      error: (err) => {
        this.tarefas = originalTarefas; // Restaura em caso de erro
        console.error('Erro ao excluir tarefa', err);
        this.notification.error('Não foi possível excluir a tarefa.');
      }
    });
  }

  loadTrashedTarefas() {
    this.isLoadingTrashed = true;
    this.tarefasService.getTrashedTarefas().subscribe({
      next: (data) => {
        this.trashedTarefas = data;
        this.isLoadingTrashed = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar lixeira', err);
        this.isLoadingTrashed = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleTrashed() {
    this.showTrashed = !this.showTrashed;
    if (this.showTrashed) {
      this.loadTrashedTarefas();
    }
  }

  restaurarTarefa(id: number) {
    this.tarefasService.restoreTarefa(id).subscribe({
      next: () => {
        this.trashedTarefas = this.trashedTarefas.filter(t => t.id !== id);
        this.notification.success('Tarefa restaurada!');
        this.loadTarefas();
      },
      error: (err) => {
        this.notification.error('Erro ao restaurar: ' + (err.error?.mensagem || err.message));
      }
    });
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

  goAdmin() {
    this.router.navigate(['/admin']);
  }

  goPerfil() {
    this.router.navigate(['/perfil']);
  }
}
