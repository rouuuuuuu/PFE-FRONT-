import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-provisioning-task',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatTableModule,
    MatProgressSpinnerModule, FormsModule,
  ],
  templateUrl: './provisioning-task.component.html', // We will assume you update the HTML to remove the task_type dropdown
  styleUrl: './provisioning-task.component.css'
})
export class ProvisioningTaskComponent implements OnInit {
  currentTaskType: string = '';
  taskDisplayName: string = '';

  form = {
    device_name: '',
    device_ip:   '',
    task_type:   '', // This will be hardcoded based on the URL
    parameters:  {}
  };

  tasks: any[] = [];
  selectedTask: any = null;
  submitting = false;
  loadingTasks = true;
  message = '';
  messageType = '';

  columns = ['device_name', 'task_type', 'status', 'created_at'];

  constructor(
    private api: ApiService, 
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Listen to URL changes so if they click a different task in the sidebar, the page updates
    this.route.paramMap.subscribe(params => {
      this.currentTaskType = params.get('taskType') || '';
      this.form.task_type = this.currentTaskType;
      
      // Format the name for the UI (e.g., "configure_vlan" -> "Configure Vlan")
      this.taskDisplayName = this.currentTaskType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      this.loadTasks(); // Reload the history table
    });
  }

  loadTasks() {
    this.loadingTasks = true;
    this.api.getProvisioningTasks().subscribe({
      next: (data) => {
        const allTasks = Array.isArray(data) ? data : (data.results || []);
        // Optional UX improvement: Filter the table to only show history for THIS specific task type
        this.tasks = allTasks.filter((t: any) => t.task_type === this.currentTaskType);
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
        
        // Reset form but keep the hardcoded task_type
        this.form = { device_name: '', device_ip: '', task_type: this.currentTaskType, parameters: {} };

        setTimeout(() => this.loadTasks(), 1000);
      },
      error: (err) => {
        this.message = `❌ Error: ${JSON.stringify(err.error)}`;
        this.messageType = 'error';
        this.submitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/provisioning']);
  }

  // ... (Keep your existing selectTask and getStatusColor methods here)
}