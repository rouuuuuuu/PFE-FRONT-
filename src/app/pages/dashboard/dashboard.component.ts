import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading = false;
      }
    });
  }

  getVendorCount(vendor: string): number {
    const found = this.stats?.devices?.routers_by_vendor
      ?.find((v: any) => v.vendor === vendor);
    return found ? found.count : 0;
  }
}