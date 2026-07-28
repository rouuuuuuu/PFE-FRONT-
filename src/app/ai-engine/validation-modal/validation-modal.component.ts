import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ValidationResult } from '../ai-engine.models';
import { TranslateModule } from '@ngx-translate/core';

export interface ValidationModalData {
  result: ValidationResult;
  canProceed: boolean;
}

@Component({
  selector: 'app-validation-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, TranslateModule],
  templateUrl: './validation-modal.component.html',
  styleUrl: './validation-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationModalComponent {
  
  constructor(
    public dialogRef: MatDialogRef<ValidationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ValidationModalData
  ) {}

  getVerdictColor(verdict: string): string {
    return ({ safe: '#22c55e', warning: '#f59e0b', blocked: '#ef4444' } as Record<string, string>)[verdict] ?? '#94a3b8';
  }

  getVerdictIcon(verdict: string): string {
    return ({ safe: '✓', warning: '⚠', blocked: '✕' } as Record<string, string>)[verdict] ?? '?';
  }

  getVerdictLabel(verdict: string): string {
    return ({ safe: 'VALIDATOR.SAFE_LABEL', warning: 'VALIDATOR.CAUTION_LABEL', blocked: 'VALIDATOR.BLOCKED_LABEL' } as Record<string, string>)[verdict] ?? 'Unknown';
  }

  getArcOffset(probability: number): number {
    return 235 - (probability * 235);
  }

  onProceed(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
