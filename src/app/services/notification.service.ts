import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { switchMap, filter, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UnreadCountResponse {
  unread_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly baseUrl = 'http://127.0.0.1:8000/api/auth/notifications';
  private isBrowser: boolean;
  private pollingSub?: Subscription;

  unreadCount$ = new BehaviorSubject<number>(0);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Start polling when user is logged in
    if (this.isBrowser) {
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.startPolling();
        } else {
          this.stopPolling();
          this.unreadCount$.next(0);
        }
      });
    }
  }

  private startPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    // Poll every 30 seconds
    this.pollingSub = timer(0, 30000).pipe(
      filter(() => this.authService.isLoggedIn()),
      switchMap(() => this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count/`).pipe(
        catchError(() => [{ unread_count: 0 }])
      ))
    ).subscribe((res: any) => {
      this.unreadCount$.next(res.unread_count || 0);
    });
  }

  private stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

  fetchCount(): void {
    if (!this.authService.isLoggedIn()) return;
    this.http.get<UnreadCountResponse>(`${this.baseUrl}/unread-count/`).pipe(
      catchError(() => [{ unread_count: 0 }])
    ).subscribe((res: any) => {
      this.unreadCount$.next(res.unread_count || 0);
    });
  }

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/mark-read/`, {});
  }

  markAllRead(): Observable<any> {
    return this.http.post(`${this.baseUrl}/mark-read/`, {});
  }
}
