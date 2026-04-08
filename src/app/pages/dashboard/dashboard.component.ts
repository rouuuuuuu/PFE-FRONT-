import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  loading = true;

  // Variables pour le contrôle de l'affichage
  expandedRow: 'top' | 'bottom' | null = null;
  activeType: string | null = null;
  chartTitle: string = '';

  // Configuration Chart.js
  public pieChartType: ChartType = 'pie';
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  toggleChart(type: string) {
    // Si on clique sur la même carte, on ferme tout
    if (this.activeType === type) {
      this.expandedRow = null;
      this.activeType = null;
      return;
    }

    this.activeType = type;
    this.chartTitle = type.charAt(0).toUpperCase() + type.slice(1);

    // Déterminer quelle ligne doit s'étendre
    const topRow = ['routers', 'switches', 'links'];
    this.expandedRow = topRow.includes(type) ? 'top' : 'bottom';

    // Préparer les données selon la carte cliquée
    switch (type) {
      case 'routers':
        this.updateChartData(
          ['Huawei', 'Cisco', 'Juniper'],
          [this.getVendorCount('huawei'), this.getVendorCount('cisco'), this.getVendorCount('juniper')],
          ['#E87722', '#ffcc00', '#1a73e8']
        );
        break;
      case 'links':
        this.updateChartData(
          ['Normal', 'Alarm'],
          [this.stats.backhaul_links.normal, this.stats.backhaul_links.alarm],
          ['#4caf50', '#f44336']
        );
        break;
      case 'ports':
        this.updateChartData(
          ['Up', 'Down'],
          [this.stats.hardware.ports.up, this.stats.hardware.ports.down],
          ['#4caf50', '#ff9800']
        );
        break;
      case 'cards':
      case 'sfps':
        const hardwareData = type === 'cards' ? this.stats.hardware.cards : this.stats.hardware.sfps;
        this.updateChartData(
          ['Normal', 'Abnormal'],
          [hardwareData.normal, hardwareData.abnormal],
          ['#4caf50', '#f44336']
        );
        break;
    }
  }

  private updateChartData(labels: string[], data: number[], colors: string[]) {
    this.pieChartData = {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        hoverBackgroundColor: colors,
      }]
    };
  }

  getVendorCount(vendor: string): number {
    const found = this.stats?.devices?.routers_by_vendor?.find((v: any) => v.vendor === vendor);
    return found ? found.count : 0;
  }
}