import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const API_URL = 'http://localhost:8000/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public token$ = this.tokenSubject.asObservable();

  private userSubject = new BehaviorSubject<any>(this.getUser());
  public user$ = this.userSubject.asObservable();

  constructor() {}

  getUserData(): any {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private getToken(): string | null {
    return sessionStorage.getItem('token'); // ✅ isolado por tab
  }

  private getUser(): any {
    const user = sessionStorage.getItem('user'); // ✅ isolado por tab
    try {
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Erro ao processar dados do usuário:', e);
      this.clearSession();
      return null;
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{token: string, user: any}>(`${API_URL}/login`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('token', response.token); // ✅
          sessionStorage.setItem('user', JSON.stringify(response.user)); // ✅
          this.tokenSubject.next(response.token);
          this.userSubject.next(response.user);
        }
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<{token: string, user: any}>(`${API_URL}/register`, { name, email, password }).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('token', response.token); // ✅
          sessionStorage.setItem('user', JSON.stringify(response.user)); // ✅
          this.tokenSubject.next(response.token);
          this.userSubject.next(response.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${API_URL}/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<{mensagem: string, user: any}>(`${API_URL}/user`, data).pipe(
      tap(response => {
        if (response.user) {
          sessionStorage.setItem('user', JSON.stringify(response.user)); // ✅
          this.userSubject.next(response.user);
        }
      })
    );
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{mensagem: string, user: any}>(`${API_URL}/user/avatar`, formData).pipe(
      tap(response => {
        if (response.user) {
          sessionStorage.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }
      })
    );
  }

  clearSession() {
    sessionStorage.removeItem('token'); // ✅
    sessionStorage.removeItem('user');  // ✅
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }
}
