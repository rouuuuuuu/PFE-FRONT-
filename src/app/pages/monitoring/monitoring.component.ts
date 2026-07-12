import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MonitoringService } from '../../services/monitoring.service';
import { AuthService } from '../../services/auth.service';
import { AiEngineService } from '../../ai-engine/ai-engine.service';
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
    FormsModule,
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

  // ── Section state (DOWN / UP) ────────────────────────────
  readonly INITIAL_SHOW = 24;
  readonly LOAD_MORE_STEP = 50;

  sections: Record<'down' | 'up', { collapsed: boolean; visibleCount: number }> = {
    down: { collapsed: false, visibleCount: this.INITIAL_SHOW },
    up:   { collapsed: true,  visibleCount: this.INITIAL_SHOW }
  };

  // ── Search ─────────────────────────────────────────────
  routerSearch = '';

  onRouterSearch(): void {
    // Reset load-more pagination when search changes
    this.sections.down.visibleCount = this.INITIAL_SHOW;
    this.sections.up.visibleCount   = this.INITIAL_SHOW;
    // Auto-expand DOWN when searching so results are immediately visible
    if (this.routerSearch.trim()) {
      this.sections.down.collapsed = false;
      this.sections.up.collapsed   = false;
    }
  }

  get downRouters() {
    const q = this.routerSearch.trim().toLowerCase();
    const all = this.network?.routers.filter(r => !r.reachable) ?? [];
    return q ? all.filter(r =>
      r.name.toLowerCase().includes(q) || r.ip.toLowerCase().includes(q)
    ) : all;
  }

  get upRouters() {
    const q = this.routerSearch.trim().toLowerCase();
    const all = this.network?.routers.filter(r =>  r.reachable) ?? [];
    return q ? all.filter(r =>
      r.name.toLowerCase().includes(q) || r.ip.toLowerCase().includes(q)
    ) : all;
  }

  visibleDownRouters() { return this.downRouters.slice(0, this.sections.down.visibleCount); }
  visibleUpRouters()   { return this.upRouters.slice(0,   this.sections.up.visibleCount);   }

  toggleSection(s: 'down' | 'up'): void {
    this.sections[s].collapsed = !this.sections[s].collapsed;
  }

  showMoreCards(s: 'down' | 'up'): void {
    const total = s === 'down' ? this.downRouters.length : this.upRouters.length;
    this.sections[s].visibleCount = Math.min(
      this.sections[s].visibleCount + this.LOAD_MORE_STEP,
      total
    );
  }

  loadMoreLabel(s: 'down' | 'up'): string {
    const total   = s === 'down' ? this.downRouters.length : this.upRouters.length;
    const visible = this.sections[s].visibleCount;
    const remain  = total - visible;
    return remain <= this.LOAD_MORE_STEP ? `+ Show remaining ${remain}` : `+ Show 50 more`;
  }

  hasMore(s: 'down' | 'up'): boolean {
    const total = s === 'down' ? this.downRouters.length : this.upRouters.length;
    return this.sections[s].visibleCount < total;
  }

  private dbPollSub: Subscription | null = null;
  private networkPollSub: Subscription | null = null;

  constructor(
    private monitoringService: MonitoringService,
    public authService: AuthService,
    private aiService: AiEngineService
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
        
        // Fetch real stats to replace 0s
        this.aiService.getStats().subscribe(stats => {
          if (this.ai && stats) {
            this.ai.validations_today.total = stats.tasks_validated || 0;
            this.ai.validations_today.blocked = stats.failures_prevented || 0;
            this.ai.validations_today.safe = (stats.tasks_validated || 0) - (stats.failures_prevented || 0);
            this.ai.validations_today.warning = 0;
          }
        });
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
        valStats: this.aiService.getStats()
      }))
    ).subscribe(data => {
      this.provisioning = data.provisioning;
      this.ai = data.ai;
      if (this.ai && data.valStats) {
        this.ai.validations_today.total = data.valStats.tasks_validated || 0;
        this.ai.validations_today.blocked = data.valStats.failures_prevented || 0;
        this.ai.validations_today.safe = (data.valStats.tasks_validated || 0) - (data.valStats.failures_prevented || 0);
        this.ai.validations_today.warning = 0;
      }
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
      voip: '#a855f7'
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
