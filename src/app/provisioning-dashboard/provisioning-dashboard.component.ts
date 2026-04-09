import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-provisioning-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './provisioning-dashboard.component.html',
  styleUrl: './provisioning-dashboard.component.css'
})
export class ProvisioningDashboardComponent {
  // Ensure the 'id' perfectly matches what your Django backend expects for "task_type"
  tasks = [
    { id: 'configure_vlan', title: 'Configure VLAN', desc: 'Deploy VLAN configurations across switches.', icon: '🔌' },
    { id: 'firmware_upgrade', title: 'Firmware Upgrade', desc: 'Schedule and push OS upgrades to network devices.', icon: '🔄' },
    { id: 'push_acl', title: 'Push ACL', desc: 'Deploy Access Control Lists to edge routers.', icon: '🛡️' }
  ];

  constructor(private router: Router) {}

  goToTask(taskId: string) {
    this.router.navigate(['/provisioning/task', taskId]);
  }
}