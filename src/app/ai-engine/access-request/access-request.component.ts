import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiEngineService } from '../ai-engine.service';
import { AccessRequest } from '../ai-engine.models';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-access-request',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatIconModule, TranslateModule],
  templateUrl: './access-request.component.html',
  styleUrl: './access-request.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessRequestComponent implements OnInit {
  accessStatus: AccessRequest | null = null;
  loading = true;
  submitting = false;
  error: string | null = null;
  reason = '';
  reasonTouched = false;

  constructor(
    private aiService: AiEngineService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.fetchStatus();
  }

  fetchStatus(): void {
    this.loading = true;
    this.error = null;
    this.aiService.getMyAccessStatus().subscribe({
      next: (status) => {
        this.accessStatus = status;
        this.loading = false;
        // If already approved or admin → just show the status
        if (status.status === 'approved' || this.authService.isAdmin()) {
          this.cdr.markForCheck();
          return;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        // 404 or no record means status = 'none'
        this.accessStatus = { status: 'none' } as AccessRequest;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get isReasonValid(): boolean {
    return this.reason.trim().length >= 10;
  }

  submitRequest(): void {
    this.reasonTouched = true;
    if (!this.isReasonValid) return;

    this.submitting = true;
    this.error = null;
    this.aiService.submitAccessRequest(this.reason.trim()).subscribe({
      next: () => {
        this.submitting = false;
        this.fetchStatus();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err.error?.detail || this.translate.instant('ACCESS_REQUEST.ERROR_SUBMIT');
        this.cdr.markForCheck();
      }
    });
  }
}
