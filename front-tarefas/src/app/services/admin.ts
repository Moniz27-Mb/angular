import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/admin`;

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);

  getStats(): Observable<any> {
    return this.http.get(`${API_URL}/stats`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${API_URL}/users`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${API_URL}/users`, userData);
  }

  getUserTasks(userId: number): Observable<any> {
    return this.http.get(`${API_URL}/users/${userId}/tarefas`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/users/${id}`);
  }

  toggleAdmin(id: number): Observable<any> {
    return this.http.patch(`${API_URL}/users/${id}/toggle-admin`, {});
  }

  getTrashedUsers(): Observable<any> {
    return this.http.get(`${API_URL}/users/trashed`);
  }

  restoreUser(id: number): Observable<any> {
    return this.http.post(`${API_URL}/users/${id}/restore`, {});
  }

  forceDeleteUser(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/users/${id}/force`);
  }
}
