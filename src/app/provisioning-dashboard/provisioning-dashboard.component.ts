import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-provisioning-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './provisioning-dashboard.component.html',
  styleUrl: './provisioning-dashboard.component.css'
})
export class ProvisioningDashboardComponent {
  // Ensure the 'id' perfectly matches what your Django backend expects for "task_type"
  tasks = [
    { id: 'configure_vlan', title: 'Configure VLAN', desc: 'Deploy VLAN configurations across switches.', icon: 'power' },
    { id: 'firmware_upgrade', title: 'Firmware Upgrade', desc: 'Schedule and push OS upgrades to network devices.', icon: 'system_update' },
    { id: 'push_acl', title: 'Push ACL', desc: 'Deploy Access Control Lists to edge routers.', icon: 'security' }
  ];

  constructor(private router: Router) { }

  goToTask(taskId: string) {
    this.router.navigate(['/provisioning/task', taskId]);
  }
}