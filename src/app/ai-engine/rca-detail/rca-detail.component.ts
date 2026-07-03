import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AiEngineService } from '../ai-engine.service';
import { RootCauseAnalysis } from '../ai-engine.models';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-rca-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TimeAgoPipe
  ],
  templateUrl: './rca-detail.component.html',
  styleUrl: './rca-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RcaDetailComponent implements OnInit {
  rca: RootCauseAnalysis | null = null;
  loading = true;
  error: string | null = null;

  // Resolve form
  showResolveInput = false;
  resolutionNote = '';
  resolving = false;

  // Numbered bullets
  readonly bullets = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

  constructor(
    private aiService: AiEngineService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const taskId = Number(this.route.snapshot.paramMap.get('taskId'));
    if (isNaN(taskId)) {
      this.error = 'Invalid task ID.';
      this.loading = false;
      return;
    }

    this.aiService.getRcaDetail(taskId).subscribe({
      next: (rca) => {
        this.rca = rca;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Failed to load RCA details.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getStepColor(status: string): string {
    return ({ ok: '#3b82f6', warn: '#f59e0b', fail: '#ef4444' } as Record<string, string>)[status] ?? '#94a3b8';
  }

  /** Detect if detail looks like a code excerpt (starts with common patterns) */
  isCodeBlock(detail: string): boolean {
    if (!detail) return false;
    const patterns = ['set ', 'delete ', 'commit', 'show ', 'display ', 'interface ', 'Error:', 'Traceback'];
    return patterns.some(p => detail.trim().startsWith(p));
  }

  resolveRca(): void {
    if (!this.rca) return;
    this.resolving = true;
    this.aiService.resolveRca(this.rca.id, this.resolutionNote).subscribe({
      next: (updated) => {
        this.rca = updated;
        this.resolving = false;
        this.showResolveInput = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.resolving = false;
        this.cdr.markForCheck();
      }
    });
  }

  navigateToRca(taskId: number): void {
    this.router.navigate(['/ai-engine/rca', taskId]);
  }

  goBack(): void {
    this.router.navigate(['/ai-engine/rca']);
  }
}
