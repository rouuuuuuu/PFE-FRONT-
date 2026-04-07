import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-provisioning',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatTableModule,
    MatProgressSpinnerModule, FormsModule,
  ],
  templateUrl: './provisioning.component.html',
  styleUrl: './provisioning.component.css'
})
export class ProvisioningComponent implements OnInit {
  form = {
    device_name: '',
    device_ip:   '',
    task_type:   '',
    parameters:  {}
  };

  tasks: any[] = [];
  selectedTask: any = null;
  submitting = false;
  loadingTasks = true;
  message = '';
  messageType = '';

  columns = ['device_name', 'task_type', 'status', 'created_at'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.api.getProvisioningTasks().subscribe({
      next: (data) => {
        this.tasks = Array.isArray(data) ? data : (data.results || []);
        this.loadingTasks = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingTasks = false;
      }
    });
  }

  startProvisioning() {
    this.submitting = true;
    this.message = '';

    this.api.startProvisioning(this.form).subscribe({
      next: (data) => {
        this.message = `✅ ${data.message} — Task ID: ${data.task_id}`;
        this.messageType = 'success';
        this.submitting = false;
        this.form = { device_name: '', device_ip: '', task_type: '', parameters: {} };

        // Refresh task list after 1 second
        setTimeout(() => this.loadTasks(), 1000);
      },
      error: (err) => {
        this.message = `❌ Error: ${JSON.stringify(err.error)}`;
        this.messageType = 'error';
        this.submitting = false;
      }
    });
  }

  selectTask(task: any) {
    this.selectedTask = task;
    // Refresh status
    this.api.getProvisioningStatus(task.id).subscribe({
      next: (data) => this.selectedTask = data,
      error: (err) => console.error(err)
    });
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
}