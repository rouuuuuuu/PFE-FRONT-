import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ValidatorDashboardComponent } from '../../ai-engine/validator-dashboard/validator-dashboard.component';
import { RcaListComponent } from '../../ai-engine/rca-list/rca-list.component';

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, ValidatorDashboardComponent, RcaListComponent],
  templateUrl: './ai-panel.component.html',
  styleUrls: ['./ai-panel.component.css']
})
export class AiPanelComponent {
  @Output() closePanel = new EventEmitter<void>();
  activeTab: 'validator' | 'rca' | 'stats' = 'validator';
}
