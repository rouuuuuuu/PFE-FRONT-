import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AiEngineService } from '../ai-engine.service';
import { ValidationResult, ValidatorStats, RootCauseAnalysis } from '../ai-engine.models';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-validator-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    TimeAgoPipe
  ],
  templateUrl: './validator-dashboard.component.html',
  styleUrl: './validator-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidatorDashboardComponent implements OnInit {
  stats: ValidatorStats | null = null;
  history: ValidationResult[] = [];
  currentResult: ValidationResult | null = null;
  lastFailed: ValidationResult | null = null;

  loading = true;
  error: string | null = null;

  // For iterating feature scores in template
  featureEntries: [string, number][] = [];

  constructor(
    private aiService: AiEngineService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load stats
    this.aiService.getStats().subscribe({
      next: (s) => {
        this.stats = s;
        this.cdr.markForCheck();
      },
      error: () => {
        this.stats = null;
        this.cdr.markForCheck();
      }
    });

    // Load validation history
    this.aiService.getValidationHistory({ limit: 20 }).subscribe({
      next: (h) => {
        this.history = h;
        // Find the latest failed task
        this.lastFailed = h.find(v => v.verdict !== 'safe') || null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Failed to load validation history.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });

    // Check for taskId query param
    const taskIdParam = this.route.snapshot.queryParamMap.get('taskId');
    if (taskIdParam) {
      const taskId = parseInt(taskIdParam, 10);
      if (!isNaN(taskId)) {
        this.aiService.getValidationResult(taskId).subscribe({
          next: (result) => {
            this.currentResult = result;
            this.featureEntries = Object.entries(result.feature_scores || {});
            this.cdr.markForCheck();
          },
          error: () => {
            this.currentResult = null;
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getVerdictColor(verdict: string): string {
    return ({ safe: '#22c55e', warning: '#f59e0b', blocked: '#ef4444' } as Record<string, string>)[verdict] ?? '#94a3b8';
  }

  getVerdictIcon(verdict: string): string {
    return ({ safe: '✓', warning: '⚠', blocked: '✕' } as Record<string, string>)[verdict] ?? '?';
  }

  getVerdictLabel(verdict: string): string {
    return ({ safe: 'Safe', warning: 'Caution', blocked: 'Blocked' } as Record<string, string>)[verdict] ?? 'Unknown';
  }

  getScoreColor(score: number): string {
    if (score >= 0.80) return '#22c55e';
    if (score >= 0.55) return '#f59e0b';
    return '#ff6b00';
  }

  getRiskColor(probability: number): string {
    const pct = probability * 100;
    if (pct >= 70) return '#22c55e';
    if (pct >= 45) return '#f59e0b';
    return '#ef4444';
  }

  getTypeColor(type: string): string {
    return ({ l2vc: '#3b82f6', voip: '#a855f7', internet: '#14b8a6' } as Record<string, string>)[type] ?? '#94a3b8';
  }

  getTypeBg(type: string): string {
    return ({ l2vc: '#3b82f618', voip: '#a855f718', internet: '#14b8a618' } as Record<string, string>)[type] ?? '#94a3b818';
  }

  /** SVG arc dashoffset: 235 = full arc */
  getArcOffset(probability: number): number {
    return 235 - (probability * 235);
  }

  navigateToRca(taskId: number): void {
    this.router.navigate(['/ai-engine/rca', taskId]);
  }

  /** Check if history item has a RCA associated — stub: always true for failed tasks */
  hasRca(item: ValidationResult): boolean {
    return item.verdict !== 'safe';
  }
}
