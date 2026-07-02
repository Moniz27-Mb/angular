import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, timeout, TimeoutError } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

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
      timeout(15000),
      tap(response => {
        if (response.token) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify(response.user));
          this.tokenSubject.next(response.token);
          this.userSubject.next(response.user);
        }
      }),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => ({ error: { mensagem: 'O servidor demorou muito a responder. Tente novamente.' } }));
        }
        return throwError(() => err);
      })
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post<{ token: string; user: any; mensagem?: string }>(
      `${API_URL}/register`,
      { name, email, password }
    ).pipe(
      timeout(15000),
      tap(response => {
        if (response.token && response.user) {
          sessionStorage.setItem('token', response.token);
          sessionStorage.setItem('user', JSON.stringify(response.user));
          this.tokenSubject.next(response.token);
          this.userSubject.next(response.user);
        }
      }),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => ({ error: { mensagem: 'O servidor demorou muito a responder. Tente novamente.' } }));
        }
        return throwError(() => err);
      })
    );
  }

  loginWithGoogle() {
    window.location.href = `${API_URL}/auth/google/redirect`;
  }

  handleSocialLogin(token: string): Observable<any> {
    sessionStorage.setItem('token', token);
    this.tokenSubject.next(token);
    
    // Fetch the user data with the new token
    return this.http.get<any>(`${API_URL}/user`).pipe(
      tap(user => {
        sessionStorage.setItem('user', JSON.stringify(user));
        this.userSubject.next(user);
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
