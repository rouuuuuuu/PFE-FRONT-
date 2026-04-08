import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // <-- Add Inject and PLATFORM_ID
import { CommonModule, isPlatformBrowser } from '@angular/common'; // <-- Add isPlatformBrowser
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-hardware-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, NgChartsModule],
  templateUrl: './hardware-summary.component.html',
  styleUrl: './hardware-summary.component.css'
})
export class HardwareSummaryComponent implements OnInit {
  ip: string = '';
  verification: any = null;
  loading = true;
  isBrowser: boolean; // <-- Add this variable

  // Pre-calculated counts
  portsUp = 0; portsDown = 0;
  cardsNormal = 0; cardsAbnormal = 0;
  sfpsNormal = 0; sfpsAbnormal = 0;

  // --- CHART CONFIGURATIONS ---
  public chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } }
  };

  public portsChartData: ChartData<'doughnut'> = { labels: ['Up', 'Down'], datasets: [{ data: [] }] };
  public cardsChartData: ChartData<'doughnut'> = { labels: ['Normal', 'Abnormal'], datasets: [{ data: [] }] };
  public sfpsChartData: ChartData<'doughnut'>  = { labels: ['Normal', 'Abnormal'], datasets: [{ data: [] }] };

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object // <-- Inject platform info
  ) {
    // Check if we are in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.ip = this.route.snapshot.paramMap.get('ip') || '';
    
    if (this.ip) {
      this.api.verifyDevice(this.ip).subscribe({
        next: (data: any) => {
          this.verification = data;
          
          this.portsUp = data.port_details?.filter((p: any) => p.status === 'up').length || 0;
          this.portsDown = data.port_details?.filter((p: any) => p.status !== 'up').length || 0;
          this.cardsNormal = data.card_details?.filter((c: any) => c.status === 'normal').length || 0;
          this.cardsAbnormal = data.card_details?.filter((c: any) => c.status !== 'normal').length || 0;
          this.sfpsNormal = data.sfp_details?.filter((s: any) => s.status === 'normal').length || 0;
          this.sfpsAbnormal = data.sfp_details?.filter((s: any) => s.status !== 'normal').length || 0;

          // Only update chart data if we are in the browser
          if (this.isBrowser) {
            this.portsChartData = {
              labels: ['Up', 'Down'],
              datasets: [{ data: [this.portsUp, this.portsDown], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
            this.cardsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{ data: [this.cardsNormal, this.cardsAbnormal], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
            this.sfpsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{ data: [this.sfpsNormal, this.sfpsAbnormal], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
          }

          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  goToDetails(type: string, status: string) {
    this.router.navigate(['/routers', this.ip, type, status]);
  }

  goBack() {
    this.router.navigate(['/routers']);
  }
}