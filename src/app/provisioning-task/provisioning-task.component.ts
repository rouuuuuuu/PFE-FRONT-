import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; // Added for Autocomplete
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { forkJoin } from 'rxjs'; // Added to fetch both routers and switches

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
export class ProvisioningTaskComponent implements OnInit {
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
      
      this.loadTasks(); // Load the history table!
      this.message = ''; 
    });

    // Load devices for the autocomplete search
    this.loadAllDevices();
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

  startProvisioning() {
    this.submitting = true;
    this.message = '';

    this.api.startProvisioning(this.form).subscribe({
      next: (data: any) => {
        this.message = `${data.message} — Task ID: ${data.task_id}`;
        this.messageType = 'success';
        this.submitting = false;
        
        this.form = { device_name: '', device_ip: '', task_type: this.currentTaskType, parameters: {} };

        setTimeout(() => this.loadTasks(), 1000);
      },
      error: (err: any) => {
        this.message = `Error: ${JSON.stringify(err.error)}`;
        this.messageType = 'error';
        this.submitting = false;
      }
    });
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
}