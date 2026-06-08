import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, MonthlyReport, GenerateReportResponse } from '../../services/api.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.css']
})
export class ReportListComponent implements OnInit {

  // ── Report list state ────────────────────────────────────────
  reports: MonthlyReport[] = [];
  isLoadingReports = false;
  loadError: string | null = null;

  // ── Generate button state ────────────────────────────────────
  isGenerating = false;

  // ── Inline notification banner ───────────────────────────────
  notification: { type: 'success' | 'error'; message: string } | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  // ── Data fetching ────────────────────────────────────────────

  /**
   * Fetches the list of monthly reports from the Django API.
   * Handles both plain arrays and paginated DRF responses (data.results).
   */
  loadReports(): void {
    this.isLoadingReports = true;
    this.loadError = null;

    this.apiService.getReports().subscribe({
      next: (data: any) => {
        // Support both plain array and DRF paginated response
        this.reports = Array.isArray(data) ? data : (data.results ?? []);
        this.isLoadingReports = false;
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.loadError = 'Could not load reports. Please check your connection and try again.';
        this.isLoadingReports = false;
      }
    });
  }

  // ── Manual generation ────────────────────────────────────────

  /**
   * Triggers the Celery task via Django REST to generate the monthly PDF report.
   * Guards against duplicate submissions and shows a notification on completion.
   */
  triggerManualReport(): void {
    if (this.isGenerating) return;

    this.isGenerating = true;
    this.notification = null;

    this.apiService.generateReportManually().subscribe({
      next: (response: GenerateReportResponse) => {
        this.isGenerating = false;
        if (response.status === 'success') {
          this.showNotification('success', response.message);
          this.loadReports(); // Refresh the table after successful generation
        } else {
          this.showNotification('error', response.message);
        }
      },
      error: (err) => {
        this.isGenerating = false;
        const msg = err.error?.message ?? `Server error (${err.status}): Failed to generate report.`;
        this.showNotification('error', msg);
      }
    });
  }

  // ── Notification helpers ─────────────────────────────────────

  showNotification(type: 'success' | 'error', message: string): void {
    this.notification = { type, message };
    setTimeout(() => { this.notification = null; }, 6000);
  }

  dismissNotification(): void {
    this.notification = null;
  }

  // ── Utility ──────────────────────────────────────────────────

  /** Returns true if the report has at least one critical alarm. */
  hasCriticalAlarms(report: MonthlyReport): boolean {
    return report.critical_alarms_count > 0;
  }
}
