import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MonitoringService } from '../../services/monitoring.service';
import { AuthService } from '../../services/auth.service';
import {
  NetworkHealth,
  ProvisioningStats,
  AiStats,
  PortStats,
  DailyPoint
} from './monitoring.models';

import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { CauseLabelPipe } from '../../pipes/cause-label.pipe';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TimeAgoPipe,
    CauseLabelPipe,
    TranslateModule
  ],
  templateUrl: './monitoring.component.html',
  styleUrls: ['./monitoring.component.css']
})
export class MonitoringComponent implements OnInit, OnDestroy {

  network: NetworkHealth | null = null;
  provisioning: ProvisioningStats | null = null;
  ai: AiStats | null = null;
  ports: PortStats | null = null;

  loading = true;
  lastUpdated = '';
  refreshingNetwork = false;

  private dbPollSub: Subscription | null = null;
  private networkPollSub: Subscription | null = null;

  constructor(
    private monitoringService: MonitoringService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    // 1. Load everything at once on init
    this.monitoringService.getSummary().subscribe({
      next: (data) => {
        this.network = data.network;
        this.provisioning = data.provisioning;
        this.ai = data.ai;
        this.ports = data.ports;
        this.lastUpdated = new Date().toLocaleTimeString();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // 2. Poll DB sections every 30s (provisioning, ai, ports)
    this.dbPollSub = interval(30000).pipe(
      switchMap(() => forkJoin({
        provisioning: this.monitoringService.getProvisioning(),
        ai: this.monitoringService.getAi(),
        ports: this.monitoringService.getPorts(),
      }))
    ).subscribe(data => {
      this.provisioning = data.provisioning;
      this.ai = data.ai;
      this.ports = data.ports;
      this.lastUpdated = new Date().toLocaleTimeString();
    });

    // 3. Poll network (SSH) every 60s separately — heavier call
    this.networkPollSub = interval(60000).pipe(
      switchMap(() => this.monitoringService.getNetwork())
    ).subscribe(data => {
      this.network = data;
    });
  }

  ngOnDestroy(): void {
    this.dbPollSub?.unsubscribe();
    this.networkPollSub?.unsubscribe();
  }

  forceRefreshNetwork(): void {
    this.refreshingNetwork = true;
    this.monitoringService.refreshNetworkCache().subscribe({
      next: () => {
        this.monitoringService.getNetwork().subscribe(d => {
          this.network = d;
          this.refreshingNetwork = false;
        });
      },
      error: () => {
        this.refreshingNetwork = false;
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────

  formatElapsed(secs: number): string {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
    return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  }

  getTaskTypeColor(type: string): string {
    const m: Record<string, string> = {
      internet: '#3b82f6',
      voip: '#a855f7',
      l2vc: '#06b6d4'
    };
    return m[type] ?? '#94a3b8';
  }

  getVendorColor(vendor: string): string {
    const m: Record<string, string> = {
      huawei: '#ef4444',
      juniper: '#22c55e'
    };
    return m[vendor?.toLowerCase()] ?? '#94a3b8';
  }

  getMaxDaily(sparkline: DailyPoint[]): number {
    return Math.max(...sparkline.map(d => d.total), 1);
  }

  getTotalRouters(breakdown: any[]): number {
    return breakdown.reduce((sum: number, v: any) => sum + v.count, 0) || 1;
  }
}
