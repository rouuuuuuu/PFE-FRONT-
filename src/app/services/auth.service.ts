import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://127.0.0.1:8000/api/auth';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** POST /api/auth/login/ — expects { email, password } */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/`, credentials).pipe(
      tap((response: any) => {
        if (this.isBrowser && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('role',  response.role  ?? 'user');
          localStorage.setItem('email', response.email ?? '');
        }
      })
    );
  }

  /** POST /api/auth/password-reset/ — prints code in Django terminal */
  resetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/password-reset/`, { email });
  }

  /** POST /api/auth/password-reset/confirm/ — { email, code, new_password } */
  confirmResetPassword(payload: { email: string; code: string; new_password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/password-reset/confirm/`, payload);
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register/`, userData);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  getRole(): string | null {
    return this.isBrowser ? localStorage.getItem('role') : null;
  }

  getEmail(): string | null {
    return this.isBrowser ? localStorage.getItem('email') : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }
}
