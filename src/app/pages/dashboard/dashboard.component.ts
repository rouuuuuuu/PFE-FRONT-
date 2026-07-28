import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';

// ── Treemap rectangle for CSS-based treemap rendering ─────────────────────
interface TreemapRect {
  label: string;
  count: number;
  color: string;
  x: number;      // left offset in %
  y: number;      // top offset in %
  width: number;   // width in %
  height: number;  // height in %
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatProgressSpinnerModule,
    MatIconModule, NgChartsModule, TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  loading = true;

  // ── Chart expansion state ────────────────────────────────────────────
  expandedRow: 'top' | 'bottom' | null = null;
  activeType: string | null = null;
  chartTitle = '';
  isTreemap = false;
  treemapRects: TreemapRect[] = [];

  // ── Chart.js configuration (dynamic per card) ────────────────────────
  public chartType: ChartType = 'pie';
  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };
  public chartData: ChartData = {
    labels: [],
    datasets: [{ data: [] }]
  };

  // ── Color palettes ───────────────────────────────────────────────────
  private colorPalette = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896'
  ];

  constructor(private api: ApiService, private router: Router) {}

  /** Navigates to the Reports page */
  goToReports(): void {
    this.router.navigate(['/reports']);
  }

  ngOnInit(): void {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        if (!this.stats.devices) this.stats.devices = {};

        // Fetch switches after stats is ready
        this.api.getSwitches().subscribe({
          next: (switchData: any) => {
            const switchesArray = Array.isArray(switchData)
              ? switchData
              : (switchData.results || []);
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

    // Secondary switch fetch for safety
    this.api.getSwitches().subscribe({
      next: (data: any) => {
        const switchesArray = Array.isArray(data) ? data : (data.results || []);
        if (!this.stats) this.stats = { devices: {} };
        if (!this.stats.devices) this.stats.devices = {};
        this.stats.devices.switches = switchesArray;
      },
      error: (err) => {
        console.error('Failed to fetch switches for dashboard', err);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TOGGLE CHART — opens the right chart type per card
  // ═══════════════════════════════════════════════════════════════════════

  toggleChart(type: string): void {
    // Collapse if same card clicked again
    if (this.activeType === type) {
      this.expandedRow = null;
      this.activeType = null;
      return;
    }

    this.activeType = type;
    this.chartTitle = type.charAt(0).toUpperCase() + type.slice(1);
    this.isTreemap = false;

    const topRow = ['routers', 'switches', 'links'];
    this.expandedRow = topRow.includes(type) ? 'top' : 'bottom';

    switch (type) {
      // ── Routers → Pie ────────────────────────────────────────────
      case 'routers':
        this.chartType = 'pie';
        this.chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        };
        this._setSimpleDataset(
          ['Huawei', 'Cisco', 'Juniper'],
          [this.getVendorCount('huawei'), this.getVendorCount('cisco'), this.getVendorCount('juniper')],
          ['#1fb631', '#ffcc00', '#1a73e8']
        );
        break;

      // ── Switches → Bar / Histogram ───────────────────────────────
      case 'switches': {
        this.chartType = 'bar';
        const swData = this.getSwitchModelData();
        const swColors = swData.labels.map(
          (_, i) => this.colorPalette[i % this.colorPalette.length]
        );
        this.chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'x' as const,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: {
                color: 'rgba(255,255,255,0.55)',
                font: { size: 10, family: 'Outfit' },
                maxRotation: 45
              },
              grid: { color: 'rgba(255,255,255,0.04)' }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: 'rgba(255,255,255,0.55)',
                precision: 0,
                font: { family: 'Outfit' }
              },
              grid: { color: 'rgba(255,255,255,0.06)' }
            }
          }
        };
        this._setSimpleDataset(swData.labels, swData.data, swColors);
        break;
      }

      // ── Backhaul Links → Horizontal Stacked Bar ──────────────────
      case 'links':
        this.chartType = 'bar';
        this.chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y' as const,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Outfit' } }
            }
          },
          scales: {
            x: {
              stacked: true,
              ticks: { color: 'rgba(255,255,255,0.55)', font: { family: 'Outfit' } },
              grid: { color: 'rgba(255,255,255,0.06)' }
            },
            y: {
              stacked: true,
              ticks: { color: 'rgba(255,255,255,0.55)', font: { family: 'Outfit' } },
              grid: { display: false }
            }
          }
        };
        this.chartData = {
          labels: ['Backhaul Links'],
          datasets: [
            {
              label: 'Normal',
              data: [this.stats.backhaul_links?.normal || 0],
              backgroundColor: '#4caf50',
              borderRadius: 4
            },
            {
              label: 'Alarm',
              data: [this.stats.backhaul_links?.alarm || 0],
              backgroundColor: '#f44336',
              borderRadius: 4
            }
          ]
        };
        break;

      // ── Ports → Doughnut ─────────────────────────────────────────
      case 'ports':
        this.chartType = 'doughnut';
        this.chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Outfit' } }
            }
          }
        };
        this._setSimpleDataset(
          ['Up', 'Down'],
          [this.stats.hardware?.ports?.up || 0, this.stats.hardware?.ports?.down || 0],
          ['#4caf50', '#ff9800']
        );
        break;

      // ── Cards → Treemap ──────────────────────────────────────────
      case 'cards': {
        this.isTreemap = true;
        const cardItems = this.getHardwareBreakdown(
          'cards', 'by_board_type',
          ['#ffca28', '#ffa726', '#ff7043', '#ab47bc', '#42a5f5']
        );
        this.treemapRects = this._computeTreemap(cardItems);
        break;
      }

      // ── SFPs → Pie ──────────────────────────────────────────────
      case 'sfps': {
        this.chartType = 'pie';
        this.chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        };
        const sfpItems = this.getHardwareBreakdown(
          'sfps', 'by_type',
          ['#4dd0e1', '#26c6da', '#00acc1', '#80deea', '#b2ebf2']
        );
        this._setSimpleDataset(
          sfpItems.map(c => c.label),
          sfpItems.map(c => c.count),
          sfpItems.map(c => c.hexColor)
        );
        break;
      }

      // ── SubCards → Treemap ───────────────────────────────────────
      case 'subcards': {
        this.isTreemap = true;
        const subItems = this.getHardwareBreakdown(
          'subcards', 'by_board_type',
          ['#ce93d8', '#ba68c8', '#9c27b0', '#e1bee7', '#7b1fa2']
        );
        this.treemapRects = this._computeTreemap(subItems);
        break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CHART.JS HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  /** Sets chart data for simple single-dataset charts (pie, doughnut, bar) */
  private _setSimpleDataset(labels: string[], data: number[], colors: string[]): void {
    this.chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors,
        borderRadius: this.chartType === 'bar' ? 4 : 0,
        borderWidth: 0
      }]
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TREEMAP COMPUTATION (recursive binary-split layout)
  // ═══════════════════════════════════════════════════════════════════════

  private _computeTreemap(items: { label: string; count: number; hexColor: string }[]): TreemapRect[] {
    if (!items.length) return [];
    const sorted = [...items].sort((a, b) => b.count - a.count);
    const rects: TreemapRect[] = [];
    const indexed = sorted.map((_, i) => ({ value: sorted[i].count, index: i }));
    this._layoutTreemap(indexed, 0, 0, 100, 100, rects, sorted);
    return rects;
  }

  private _layoutTreemap(
    items: { value: number; index: number }[],
    x: number, y: number, w: number, h: number,
    result: TreemapRect[],
    source: { label: string; count: number; hexColor: string }[]
  ): void {
    if (!items.length) return;

    // Base case — single item fills the entire rect
    if (items.length === 1) {
      const s = source[items[0].index];
      result.push({ label: s.label, count: s.count, color: s.hexColor, x, y, width: w, height: h });
      return;
    }

    const total = items.reduce((sum, i) => sum + i.value, 0);
    if (total === 0) return;

    // Find split point closest to half the total
    let cumulative = 0;
    let splitIdx = 0;
    for (let i = 0; i < items.length - 1; i++) {
      cumulative += items[i].value;
      if (cumulative >= total / 2) { splitIdx = i; break; }
    }

    const left = items.slice(0, splitIdx + 1);
    const right = items.slice(splitIdx + 1);
    const ratio = left.reduce((s, i) => s + i.value, 0) / total;

    // Alternate split direction for better aspect ratios
    if (w >= h) {
      this._layoutTreemap(left,  x,             y, w * ratio,       h, result, source);
      this._layoutTreemap(right, x + w * ratio,  y, w * (1 - ratio), h, result, source);
    } else {
      this._layoutTreemap(left,  x, y,             w, h * ratio,       result, source);
      this._layoutTreemap(right, x, y + h * ratio,  w, h * (1 - ratio), result, source);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  DATA HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  getVendorCount(vendor: string): number {
    const found = this.stats?.devices?.routers_by_vendor?.find(
      (v: any) => v.vendor?.toLowerCase() === vendor.toLowerCase()
    );
    return found ? found.count : 0;
  }

  getHardwareBreakdown(category: string, subcategory: string, palette: string[]): any[] {
    const dataObj = this.stats?.hardware_breakdowns?.[category]?.[subcategory];
    if (!dataObj) return [];

    const sorted = Object.entries(dataObj)
      .map(([label, count]) => ({ label, count: count as number }))
      .sort((a, b) => b.count - a.count);

    return sorted.map((item, i) => ({
      ...item,
      hexColor: palette[i % palette.length],
    })).slice(0, 5); // Top 5
  }

  getSwitchModelData(): { labels: string[]; data: number[] } {
    // Group from raw switch array
    if (this.stats?.devices?.switches && Array.isArray(this.stats.devices.switches)) {
      const counts = this.stats.devices.switches.reduce((acc: any, sw: any) => {
        const rawName = sw.model || sw.Modele || 'Unknown';
        const clean = String(rawName).replace(/\u00a0/g, ' ').trim().toUpperCase();
        acc[clean] = (acc[clean] || 0) + 1;
        return acc;
      }, {});
      return { labels: Object.keys(counts), data: Object.values(counts) as number[] };
    }

    // Fallback: pre-grouped by backend
    if (this.stats?.devices?.switches_by_model) {
      const grouped = this.stats.devices.switches_by_model.reduce((acc: any, x: any) => {
        const name = String(x.model || 'Unknown').trim().toUpperCase();
        acc[name] = (acc[name] || 0) + x.count;
        return acc;
      }, {});
      return { labels: Object.keys(grouped), data: Object.values(grouped) as number[] };
    }

    return { labels: ['Loading…'], data: [1] };
  }

  getTotalSwitches(): number {
    return this.stats?.devices?.switches?.length || 0;
  }
}
