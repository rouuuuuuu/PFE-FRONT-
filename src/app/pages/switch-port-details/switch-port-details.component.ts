import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-switch-port-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './switch-port-details.component.html',
  styleUrl: './switch-port-details.component.css'
})
export class SwitchPortDetailsComponent implements OnInit {
  ip: string = '';
  statusFilter: string = '';

  deviceInfo: any = null;
  filteredPorts: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    // Grab URL params:  /switches/:ip/ports/:status
    this.ip           = this.route.snapshot.paramMap.get('ip')     || '';
    this.statusFilter = this.route.snapshot.paramMap.get('status') || '';

    if (this.ip) {
      // Use getUnifiedDevice (all-devices) — same endpoint, contains full port data
      this.api.getUnifiedDevice(this.ip).subscribe({
        next: (data: any) => {
          // Normalize device name
          data.device_name = data.device_name || data.ne_name || data.name || 'Unknown Device';
          this.deviceInfo = data;

          // all-devices uses 'ports'; verifyDevice/verifySwitch uses 'port_details'
          const portList = data.ports || data.port_details || [];

          this.filteredPorts = portList.filter(
            (p: any) => (p.oper_status || p.status || '').toLowerCase() === this.statusFilter.toLowerCase()
          );
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to fetch switch port details', err);
          this.loading = false;
        }
      });
    }
  }

  /** Go back to the switch summary page */
  goBack() {
    this.router.navigate(['/switches', this.ip]);
  }
}
