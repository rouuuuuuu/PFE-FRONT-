import { Component, EventEmitter, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ValidatorDashboardComponent } from '../../ai-engine/validator-dashboard/validator-dashboard.component';
import { RcaListComponent } from '../../ai-engine/rca-list/rca-list.component';
import { AiEngineService } from '../../ai-engine/ai-engine.service';
import { ValidatorStats } from '../../ai-engine/ai-engine.models';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, ValidatorDashboardComponent, RcaListComponent, TranslateModule],
  templateUrl: './ai-panel.component.html',
  styleUrls: ['./ai-panel.component.css']
})
export class AiPanelComponent {
  @Output() closePanel = new EventEmitter<void>();

  private _activeTab: 'validator' | 'rca' | 'stats' = 'validator';
  statsData: ValidatorStats | null = null;
  statsLoading = false;
  private statsFetched = false;

  constructor(private aiService: AiEngineService) {}

  get activeTab(): 'validator' | 'rca' | 'stats' {
    return this._activeTab;
  }

  set activeTab(tab: 'validator' | 'rca' | 'stats') {
    this._activeTab = tab;
    if (tab === 'stats' && !this.statsFetched) {
      this.loadStats();
    }
  }

  get isEmptyStats(): boolean {
    if (!this.statsData) return true;
    const d = this.statsData;
    return d.tasks_validated === 0
        && d.failures_prevented === 0
        && d.model_accuracy === 0
        && d.avg_rca_seconds === 0;
  }

  private loadStats(): void {
    this.statsLoading = true;
    this.aiService.getStats().subscribe({
      next: (data) => {
        this.statsData = data;
        this.statsLoading = false;
        this.statsFetched = true;
      },
      error: () => {
        this.statsData = null;
        this.statsLoading = false;
        this.statsFetched = true;
      }
    });
  }
}
