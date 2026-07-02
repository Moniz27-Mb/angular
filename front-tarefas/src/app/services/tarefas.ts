import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string;
  concluida: boolean;
  prioridade?: 'baixa' | 'media' | 'alta';
  data_vencimento?: string;
  criado_em?: string; // corresponde ao campo retornado pelo TarefaResource
}

@Injectable({
  providedIn: 'root',
})
export class TarefasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tarefas`;

  getTarefas(): Observable<Tarefa[]> {
    return this.http.get<{data: Tarefa[]}>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  createTarefa(tarefa: Partial<Tarefa>): Observable<Tarefa> {
    return this.http.post<{data: Tarefa}>(this.apiUrl, tarefa).pipe(
      map(response => response.data)
    );
  }

  updateTarefa(id: number, tarefa: Partial<Tarefa>): Observable<Tarefa> {
    return this.http.put<{data: Tarefa}>(`${this.apiUrl}/${id}`, tarefa).pipe(
      map(response => response.data)
    );
  }

  deleteTarefa(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getTrashedTarefas(): Observable<Tarefa[]> {
    return this.http.get<{data: Tarefa[]}>(`${this.apiUrl}/trashed`).pipe(
      map(response => response.data)
    );
  }

  restoreTarefa(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }
}
