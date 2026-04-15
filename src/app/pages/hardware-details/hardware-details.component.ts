import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-hardware-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './hardware-details.component.html',
  styleUrl: './hardware-details.component.css'
})
export class HardwareDetailsComponent implements OnInit {
  ip: string = '';
  componentType: string = ''; // e.g., 'ports', 'cards', 'sfps'
  statusFilter: string = '';  // e.g., 'up', 'down', 'normal', 'abnormal'
  
  deviceInfo: any = null;
  filteredData: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    // 1. Grab the exact parameters from the URL
    this.ip = this.route.snapshot.paramMap.get('ip') || '';
    this.componentType = this.route.snapshot.paramMap.get('component') || '';
    this.statusFilter = this.route.snapshot.paramMap.get('status') || '';

    // 2. Fetch the data
    if (this.ip) {
      this.api.verifyDevice(this.ip).subscribe({
        next: (data) => {
          console.log(`=== HARDWARE DATA FOR ${this.componentType.toUpperCase()} ===`, data);
          this.deviceInfo = data;
          this.extractAndFilterData(data);
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

extractAndFilterData(data: any) {
    let sourceArray: any[] = [];
    
    switch (this.componentType) {
      case 'ports': sourceArray = data.port_details || []; break;
      case 'cards': sourceArray = data.card_details || []; break;
      case 'sfps':  sourceArray = data.sfp_details || []; break;
    }

    // Le HTML va maintenant lire directement item.rx_power, item.hardware_version, etc !
    this.filteredData = sourceArray.filter(
      item => item.status?.toLowerCase() === this.statusFilter.toLowerCase()
    );
  }

  goBack() {
    // Navigate back to the summary page for this specific IP
    this.router.navigate(['/routers', this.ip]);
  }
}