import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiEngineService } from '../ai-engine.service';
import { AccessRequest } from '../ai-engine.models';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TimeAgoPipe,
    TranslateModule
  ],
  templateUrl: './admin-requests.component.html',
  styleUrl: './admin-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRequestsComponent implements OnInit {
  requests: AccessRequest[] = [];
  loading = true;
  error: string | null = null;

  activeTab: 'pending' | 'approved' | 'refused' = 'pending';

  // Inline review state — keyed by request id
  reviewingId: number | null = null;
  reviewAction: 'approve' | 'refuse' | null = null;
  reviewNote = '';
  submittingReview = false;

  // Track cards being removed (for exit animation)
  removingIds = new Set<number>();

  constructor(
    private aiService: AiEngineService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.error = null;
    this.reviewingId = null;

    this.aiService.getAccessRequests(this.activeTab).subscribe({
      next: (list: any) => {
        this.requests = list?.results ? list.results : list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = this.translate.instant('ADMIN_REQUESTS.ERROR_LOAD');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  switchTab(tab: 'pending' | 'approved' | 'refused'): void {
    this.activeTab = tab;
    this.loadRequests();
  }

  get pendingCount(): number {
    return this.activeTab === 'pending' ? this.requests.length : 0;
  }

  // ── Review flow ───────────────────────────────────────────────────────────

  startReview(id: number, action: 'approve' | 'refuse'): void {
    this.reviewingId = id;
    this.reviewAction = action;
    this.reviewNote = '';
  }

  cancelReview(): void {
    this.reviewingId = null;
    this.reviewAction = null;
    this.reviewNote = '';
  }

  submitReview(): void {
    if (this.reviewingId === null || !this.reviewAction) return;

    this.submittingReview = true;
    const id = this.reviewingId;
    const action = this.reviewAction;

    this.aiService.reviewRequest(id, action, this.reviewNote).subscribe({
      next: () => {
        this.submittingReview = false;
        this.reviewingId = null;
        this.reviewAction = null;

        // Animate card out then remove
        this.removingIds.add(id);
        this.cdr.markForCheck();

        setTimeout(() => {
          this.requests = this.requests.filter(r => r.id !== id);
          this.removingIds.delete(id);
          this.cdr.markForCheck();
          if (this.notificationService.fetchCount) {
            this.notificationService.fetchCount();
          }
        }, 350);
      },
      error: () => {
        this.submittingReview = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Expand/collapse reason text
  expandedIds = new Set<number>();

  toggleExpand(id: number): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
    this.cdr.markForCheck();
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }
}
