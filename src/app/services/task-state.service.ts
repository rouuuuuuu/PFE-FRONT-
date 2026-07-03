import { Injectable } from '@angular/core';

export interface ProvisioningState {
  taskId: number | null;
  status: string;           // 'queued' | 'running' | 'completed' | 'failed' | 'liberated'
  formData: any;            // full form payload
  activeStep: number;       // wizard step index
  deviceName: string;
  taskType: string;
  completedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class TaskStateService {
  // One slot per provisioning type
  private states: Record<string, ProvisioningState> = {};

  save(taskType: string, state: ProvisioningState): void {
    this.states[taskType] = state;
  }

  restore(taskType: string): ProvisioningState | null {
    return this.states[taskType] || null;
  }

  clear(taskType: string): void {
    delete this.states[taskType];
  }

  hasActiveTask(taskType: string): boolean {
    const state = this.states[taskType];
    if (!state) return false;
    return ['queued', 'running', 'completed'].includes(state.status);
  }
}
