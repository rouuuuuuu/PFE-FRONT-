import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, NgChartsModule],
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

  // Palette de couleurs pour les multiples modèles de switch
  private colorPalette = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896'
  ];

  constructor(private api: ApiService) {}

 ngOnInit() {
  this.api.getDashboardStats().subscribe({
    next: (data) => {
      this.stats = data;
      if (!this.stats.devices) this.stats.devices = {};

      // ✅ Fetch switches AFTER stats is ready
      this.api.getSwitches().subscribe({
        next: (switchData: any) => {
          const switchesArray = Array.isArray(switchData) ? switchData : (switchData.results || []);
          this.stats.devices.switches = switchesArray;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to fetch switches', err);
          this.loading = false;
        }
      });
    },
    error: (err) => {
      console.error('Error fetching dashboard stats:', err);
      this.loading = false;
    }
  });


    // 2. Fetcher LES SWITCHES pour garantir qu'on a les données du pie chart
    this.api.getSwitches().subscribe({
      next: (data: any) => {
        // Gérer la pagination Django (data.results) ou un tableau classique
        const switchesArray = Array.isArray(data) ? data : (data.results || []);
        
        // S'assurer que stats.devices existe avant d'y attacher les switches
        if (!this.stats) this.stats = { devices: {} };
        if (!this.stats.devices) this.stats.devices = {};
        
        // Attacher les switches récupérés à l'objet stats
        this.stats.devices.switches = switchesArray;
      },
      error: (err) => {
        console.error('Failed to fetch switches for dashboard', err);
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
          ['#1fb631', '#ffcc00', '#1a73e8']
        );
        break;

      case 'switches':
        const switchData = this.getSwitchModelData();
        // Attribuer une couleur à chaque modèle
        const switchColors = switchData.labels.map((_, i) => this.colorPalette[i % this.colorPalette.length]);
        
        this.updateChartData(
          switchData.labels,
          switchData.data,
          switchColors
        );
        break;

      case 'links':
        this.updateChartData(
          ['Normal', 'Alarm'],
          [this.stats.backhaul_links?.normal || 0, this.stats.backhaul_links?.alarm || 0],
          ['#4caf50', '#f44336']
        );
        break;

      case 'ports':
        this.updateChartData(
          ['Up', 'Down'],
          [this.stats.hardware?.ports?.up || 0, this.stats.hardware?.ports?.down || 0],
          ['#4caf50', '#ff9800']
        );
        break;

      case 'cards':
      case 'sfps':
        const hardwareData = type === 'cards' ? this.stats.hardware?.cards : this.stats.hardware?.sfps;
        this.updateChartData(
          ['Normal', 'Abnormal'],
          [hardwareData?.normal || 0, hardwareData?.abnormal || 0],
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
    const found = this.stats?.devices?.routers_by_vendor?.find((v: any) => v.vendor?.toLowerCase() === vendor.toLowerCase());
    return found ? found.count : 0;
  }

  // Helper pour extraire, NETTOYER et grouper les modèles de switches
  // Helper pour extraire, NETTOYER et grouper les modèles de switches
  getSwitchModelData(): { labels: string[], data: number[] } {
    
    // 1. Si l'API renvoie un tableau de switches (ce qui est votre cas)
    if (this.stats?.devices?.switches && Array.isArray(this.stats.devices.switches)) {
      const counts = this.stats.devices.switches.reduce((acc: any, sw: any) => {
        
        // Récupérer le nom (gère 'model' de l'API ou 'Modele' du CSV)
        let rawName = sw.model || sw.Modele || 'Unknown';

        // LA SOLUTION AU BUG :
        // .replace(/\u00a0/g, " ") -> Supprime les espaces insécables invisibles (Excel)
        // .trim()                  -> Supprime les espaces normaux au début/fin
        // .toUpperCase()           -> Fusionne "ex4300" et "EX4300"
        const cleanModelName = String(rawName)
          .replace(/\u00a0/g, " ") 
          .trim()
          .toUpperCase(); 

        acc[cleanModelName] = (acc[cleanModelName] || 0) + 1;
        return acc;
      }, {});

      return {
        labels: Object.keys(counts),
        data: Object.values(counts) as number[]
      };
    }

    // 2. Sécurité si les données sont déjà groupées par le backend
    if (this.stats?.devices?.switches_by_model) {
      const grouped = this.stats.devices.switches_by_model.reduce((acc: any, x: any) => {
        const name = String(x.model || 'Unknown').trim().toUpperCase();
        acc[name] = (acc[name] || 0) + x.count;
        return acc;
      }, {});

      return {
        labels: Object.keys(grouped),
        data: Object.values(grouped) as number[]
      };
    }

    // Fallback pendant le chargement
    return { labels: ['Chargement...'], data: [1] };
  }
getTotalSwitches(): number {
  return this.stats?.devices?.switches?.length || 0;
}}