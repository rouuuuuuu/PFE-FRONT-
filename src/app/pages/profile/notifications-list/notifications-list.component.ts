import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.css']
})
export class NotificationsListComponent implements OnInit {
  notifications: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (data: any) => {
        this.notifications = data?.results ? data.results : data;
        this.loading = false;

        // Auto mark all as read since user is now viewing them
        this.notificationService.markAllRead().subscribe(() => {
          if (this.notificationService.fetchCount) {
            this.notificationService.fetchCount();  // updates the red dot immediately
          }
        });
      },
      error: (err) => {
        console.error('Error loading notifications', err);
        this.error = 'Failed to load notifications';
        this.loading = false;
      }
    });
  }

  markAsRead(notif: any): void {
    if (notif.is_read) return;
    this.notificationService.markAsRead(notif.id).subscribe({
      next: () => {
        notif.is_read = true;
        // decrement unread count
        const currentCount = this.notificationService.unreadCount$.value;
        if (currentCount > 0) {
          this.notificationService.unreadCount$.next(currentCount - 1);
        }
      },
      error: (err: any) => console.error('Failed to mark as read', err)
    });
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.loadNotifications();
        this.notificationService.unreadCount$.next(0);
      },
      error: (err: any) => console.error('Failed to mark all as read', err)
    });
  }
}
