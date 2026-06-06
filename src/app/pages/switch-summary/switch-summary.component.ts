import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-switch-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, NgChartsModule, TranslateModule],
  templateUrl: './switch-summary.component.html',
  styleUrl: './switch-summary.component.css'
})
export class SwitchSummaryComponent implements OnInit {
  ip: string = '';
  verification: any = null;
  loading = true;
  isBrowser: boolean;

  // Port counts
  portsUp = 0;
  portsDown = 0;

  // Card counts
  cardsNormal = 0;
  cardsAbnormal = 0;

  // SFP counts
  sfpsNormal = 0;
  sfpsAbnormal = 0;

  // Chart configuration
  public chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } }
  };

  public portsChartData: ChartData<'doughnut'> = {
    labels: ['Up', 'Down'],
    datasets: [{ data: [] }]
  };

  public cardsChartData: ChartData<'doughnut'> = {
    labels: ['Normal', 'Abnormal'],
    datasets: [{ data: [] }]
  };

  public sfpsChartData: ChartData<'doughnut'> = {
    labels: ['Normal', 'Abnormal'],
    datasets: [{ data: [] }]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.ip = this.route.snapshot.paramMap.get('ip') || '';

    if (this.ip) {
      // Use getUnifiedDevice (all-devices) — contains full hardware data for both routers and switches
      this.api.getUnifiedDevice(this.ip).subscribe({
        next: (data: any) => {
          // Normalize device name across different backend field names
          data.device_name = data.device_name || data.ne_name || data.name || 'Unknown Device';
          this.verification = data;

          // --- Ports: all-devices uses 'ports', fallback to 'port_details' ---
          const portList = data.ports || data.port_details || [];
          this.portsUp   = portList.filter((p: any) => (p.oper_status || p.status || '').toLowerCase() === 'up').length;
          this.portsDown = portList.filter((p: any) => (p.oper_status || p.status || '').toLowerCase() !== 'up').length;

          // --- Cards: all-devices uses 'cards', status field is 'board_status' ---
          const cardList = data.cards || data.card_details || [];
          this.cardsNormal   = cardList.filter((c: any) => (c.board_status || c.status || '').toLowerCase() === 'normal').length;
          this.cardsAbnormal = cardList.filter((c: any) => (c.board_status || c.status || '').toLowerCase() !== 'normal').length;

          // --- SFPs: all-devices uses 'sfps', status field is 'rx_status' ---
          const sfpList = data.sfps || data.sfp_details || [];
          this.sfpsNormal   = sfpList.filter((s: any) => (s.rx_status || s.status || '').toLowerCase() === 'normal').length;
          this.sfpsAbnormal = sfpList.filter((s: any) => (s.rx_status || s.status || '').toLowerCase() !== 'normal').length;

          // Only build charts when running in the browser
          if (this.isBrowser) {
            this.portsChartData = {
              labels: ['Up', 'Down'],
              datasets: [{
                data: [this.portsUp, this.portsDown],
                backgroundColor:      ['#4caf50', '#f44336'],
                hoverBackgroundColor: ['#45a049', '#e53935']
              }]
            };
            this.cardsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{
                data: [this.cardsNormal, this.cardsAbnormal],
                backgroundColor:      ['#4caf50', '#f44336'],
                hoverBackgroundColor: ['#45a049', '#e53935']
              }]
            };
            this.sfpsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{
                data: [this.sfpsNormal, this.sfpsAbnormal],
                backgroundColor:      ['#4caf50', '#f44336'],
                hoverBackgroundColor: ['#45a049', '#e53935']
              }]
            };
          }

          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to fetch switch hardware data', err);
          this.loading = false;
        }
      });
    }
  }

  /** Navigate to filtered port details (up or down) */
  goToDetails(status: string) {
    this.router.navigate(['/switches', this.ip, 'ports', status]);
  }

  /** Back to switches list */
  goBack() {
    this.router.navigate(['/switches']);
  }
}
