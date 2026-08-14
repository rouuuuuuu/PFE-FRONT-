import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  role: 'Admin' | 'Engineer';
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
  ai_access: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;
  private isBrowser: boolean;

  currentUser$ = new BehaviorSubject<CurrentUser | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** GET /api/auth/me/extended/ */
  loadCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/api/auth/me/extended/`).pipe(
      tap(user => this.currentUser$.next(user))
    );
  }

  /** PATCH /api/auth/profile/ */
  updateProfile(data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/profile/`, data).pipe(
      tap(() => this.loadCurrentUser().subscribe())
    );
  }

  /** POST /api/auth/change-password/ */
  changePassword(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-password/`, payload);
  }

  /** PATCH /api/auth/users/<id>/change-password/ */
  forceResetPassword(id: number, new_password: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}/change-password/`, { new_password });
  }

  /** GET /api/auth/users/ */
  getUsers(params?: any): Observable<CurrentUser[]> {
    return this.http.get<CurrentUser[]>(`${this.baseUrl}/users/`, { params });
  }

  /** PATCH /api/auth/users/<id>/change-password/ */
  updateUserCredentials(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}/change-password/`, data);
  }

  /** PATCH /api/auth/users/<id>/toggle-active/ */
  toggleUserActive(id: number, is_active: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${id}/toggle-active/`, { is_active });
  }

  /** POST /api/auth/send-credentials/ */
  sendCredentials(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-credentials/`, payload);
  }

  /** POST /api/auth/login/ */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login/`, credentials).pipe(
      tap((response: any) => {
        if (this.isBrowser && response.token) {
          localStorage.setItem('token', response.token);
          this.loadCurrentUser().subscribe();
        }
      })
    );
  }

  /** POST /api/auth/password-reset/ */
  resetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/password-reset/`, { email });
  }

  /** POST /api/auth/password-reset/confirm/ */
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
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUser$.value;
    return user ? user.is_admin : false;
  }

  getInitials(user: CurrentUser | null): string {
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  }

  getAvatarColor(username: string | null | undefined): string {
    if (!username) return '#3B82F6';
    const palette = ['#FF7900','#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }
}
