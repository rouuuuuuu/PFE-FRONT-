import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { forkJoin, Subscription, interval } from 'rxjs';
import { switchMap, takeWhile, tap } from 'rxjs/operators';

@Component({
  selector: 'app-provisioning-task',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatTableModule,
    MatProgressSpinnerModule, FormsModule,
    MatAutocompleteModule, MatIconModule
  ],
  templateUrl: './provisioning-task.component.html',
  styleUrl: './provisioning-task.component.css'
})
export class ProvisioningTaskComponent implements OnInit, OnDestroy {
  currentTaskType: string = '';
  taskDisplayName: string = '';

  form = {
    device_name: '',
    device_ip:   '',
    task_type:   '',
    parameters:  {}
  };

  tasks: any[] = [];
  submitting = false;
  loadingTasks = true;
  message = '';
  messageType = '';

  columns = ['device_name', 'status', 'created_at'];

  // Variables for the Autocomplete Dropdown
  allDevices: any[] = [];
  filteredDevices: any[] = [];

  // Live status polling state
  activeTaskId: number | null = null;
  liveStatus: string = '';
  liveOutput: string = '';
  liveStartedAt: string | null = null;
  liveCompletedAt: string | null = null;
  isPolling = false;

  private pollSub: Subscription | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.currentTaskType = params.get('taskType') || '';
      this.form.task_type = this.currentTaskType;

      this.taskDisplayName = this.currentTaskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      this.loadTasks();
      this.message = '';
      this.resetLiveStatus();
    });

    this.loadAllDevices();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  // --- AUTOCOMPLETE LOGIC ---
  loadAllDevices() {
    forkJoin({
      routers: this.api.getRouters(),
      switches: this.api.getSwitches()
    }).subscribe({
      next: (data: any) => {
        const routers = Array.isArray(data.routers) ? data.routers : (data.routers.results || []);
        const switches = Array.isArray(data.switches) ? data.switches : (data.switches.results || []);

        this.allDevices = [...routers, ...switches];
        this.filteredDevices = this.allDevices;
      },
      error: (err) => console.error('Failed to load devices', err)
    });
  }

  filterDevices(searchTerm: string) {
    if (!searchTerm) {
      this.filteredDevices = this.allDevices;
      return;
    }
    const lowerTerm = searchTerm.toLowerCase();
    this.filteredDevices = this.allDevices.filter(device =>
      device.name?.toLowerCase().includes(lowerTerm) ||
      device.loopback_ip?.toLowerCase().includes(lowerTerm)
    );
  }

  onDeviceSelected(event: any) {
    const selectedName = event.option.value;
    const device = this.allDevices.find(d => d.name === selectedName);
    if (device) {
      this.form.device_ip = device.loopback_ip || '';
    }
  }

  // --- ORIGINAL TASK LOGIC ---
  loadTasks() {
    this.loadingTasks = true;
    this.api.getProvisioningTasks().subscribe({
      next: (data: any) => {
        const allTasks = Array.isArray(data) ? data : (data.results || []);
        this.tasks = allTasks.filter((t: any) => t.task_type === this.currentTaskType);
        this.loadingTasks = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loadingTasks = false;
      }
    });
  }

  // --- LIVE STATUS POLLING ---
  startProvisioning() {
    this.submitting = true;
    this.message = '';
    this.resetLiveStatus();

    this.api.startProvisioning(this.form).subscribe({
      next: (data: any) => {
        this.submitting = false;
        this.activeTaskId = data.task_id;
        this.liveStatus = 'queued';
        this.isPolling = true;
        this.message = `Task queued — ID: ${data.task_id}`;
        this.messageType = 'success';

        this.form = { device_name: '', device_ip: '', task_type: this.currentTaskType, parameters: {} };

        this.beginPolling(data.task_id);
      },
      error: (err: any) => {
        this.message = `Error: ${JSON.stringify(err.error)}`;
        this.messageType = 'error';
        this.submitting = false;
      }
    });
  }

  beginPolling(taskId: number) {
    this.stopPolling(); // safety: clear any previous subscription

    this.pollSub = interval(3000).pipe(
      switchMap(() => this.api.getProvisioningStatus(taskId)),
      tap((status: any) => {
        this.liveStatus      = status.status;
        this.liveOutput      = status.result || status.output || '';
        this.liveStartedAt   = status.started_at || null;
        this.liveCompletedAt = status.completed_at || null;
      }),
      takeWhile((status: any) =>
        status.status !== 'completed' && status.status !== 'failed', true
      )
    ).subscribe({
      next: () => {},
      complete: () => {
        this.isPolling = false;
        // Refresh the history table once polling ends
        setTimeout(() => this.loadTasks(), 500);
      },
      error: (err) => {
        console.error('Polling error', err);
        this.isPolling = false;
        this.liveStatus = 'failed';
      }
    });
  }

  stopPolling() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  resetLiveStatus() {
    this.stopPolling();
    this.activeTaskId    = null;
    this.liveStatus      = '';
    this.liveOutput      = '';
    this.liveStartedAt   = null;
    this.liveCompletedAt = null;
    this.isPolling       = false;
  }

  goBack() {
    this.router.navigate(['/provisioning']);
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'queued':    '#888',
      'running':   '#1a73e8',
      'completed': '#4caf50',
      'failed':    '#f44336',
    };
    return colors[status] || '#888';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'queued':    'schedule',
      'running':   'sync',
      'completed': 'check_circle',
      'failed':    'cancel',
    };
    return icons[status] || 'help_outline';
  }
}