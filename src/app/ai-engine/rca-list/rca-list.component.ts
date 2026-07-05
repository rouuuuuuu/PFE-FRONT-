import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiEngineService } from '../ai-engine.service';
import { RootCauseAnalysis } from '../ai-engine.models';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-rca-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TimeAgoPipe,
    TranslateModule
  ],
  templateUrl: './rca-list.component.html',
  styleUrl: './rca-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RcaListComponent implements OnInit {
  rcas: RootCauseAnalysis[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  showResolved = false;
  filterType = '';
  filterCause = '';

  // Cause category colors
  causeColors: Record<string, string> = {
    'config_syntax':       '#3b82f6',
    'connectivity':        '#ef4444',
    'authentication':      '#f59e0b',
    'timeout':             '#a855f7',
    'resource_exhaustion': '#ec4899',
    'version_mismatch':    '#14b8a6',
    'dependency_failure':  '#6366f1',
    'permission_denied':   '#f97316',
    'hardware_fault':      '#dc2626',
    'unknown':             '#94a3b8'
  };

  constructor(
    private aiService: AiEngineService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRcas();
  }

  loadRcas(): void {
    this.loading = true;
    this.error = null;

    this.aiService.getRcaList({
      is_resolved: this.showResolved ? undefined : false,
      cause: this.filterCause || undefined,
      limit: 50
    }).subscribe({
      next: (list) => {
        this.rcas = list;
        if (this.filterType) {
          this.rcas = this.rcas.filter(r => r.task_type === this.filterType);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load RCA list.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getCauseColor(cause: string): string {
    return this.causeColors[cause] || '#94a3b8';
  }

  getCauseBg(cause: string): string {
    return (this.causeColors[cause] || '#94a3b8') + '18';
  }

  viewDetail(taskId: number): void {
    this.router.navigate(['/ai-engine/rca', taskId]);
  }

  resolveRca(rca: RootCauseAnalysis): void {
    this.aiService.resolveRca(rca.id, '').subscribe({
      next: () => {
        this.rcas = this.rcas.filter(r => r.id !== rca.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void {
    this.loadRcas();
  }
}
