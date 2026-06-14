import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { ProvisioningService } from '../../services/provisioning.service';

interface Device {
  device_id: number;
  ne_name: string;
  ip_address: string;
  vendor: string;
  device_type: string;
  ports?: any[];
}

interface PortOption {
  label: string;         // display: "name" or "name — description"
  interface: string;     // base interface name (before ".")
  vlan: string;
  description: string;
  physical: string;      // physical status from API
  protocol: string;      // protocol status from API
}

interface Upgrade {
  upgrade_id: number;
  device_name: string;
  device_ip: string;
  vendor: string;
  interface: string;
  vlan: string;
  customer_name: string;
  old_bandwidth_mbps: number | null;
  new_bandwidth_mbps: number;
  status: string;
  is_upgrade: boolean | null;
  created_at: string;
  created_by: string;
  generated_commands: string;
  execution_output: string;
}

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTableModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit, OnDestroy {
  private readonly BASE_URL = 'http://127.0.0.1:8000';
  private apiUrl = `${this.BASE_URL}/api/provisioning`;
  private destroy$ = new Subject<void>();
  private readonly POLL_MS = 10_000;

  // ─── Device search ───
  searchQuery = '';
  allDevices: Device[] = [];
  filteredDevicesList: Device[] = [];
  loadingDevices = false;

  // ─── Selected device & sync ───
  selectedDevice: Device | null = null;
  syncingRouter = false;
  syncDone = false;

  // ─── Interface dropdown ───
  portOptions: PortOption[] = [];
  selectedPort: PortOption | null = null;

  // ─── Bandwidth ───
  newBandwidth: number | null = null;
  knownOldBandwidth: number | null = null;

  // ─── Submission ───
  submitting = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  // ─── History ───
  upgrades: Upgrade[] = [];
  filterStatus = 'all';
  searchHistoryQuery = '';
  columns: string[] = [
    'upgrade_id', 'device_name', 'interface',
    'customer_name', 'bandwidth', 'is_upgrade',
    'status', 'created_at', 'swan_ticket', 'download'
  ];

  // ─── Detail modal ───
  showDetailModal = false;
  selectedUpgradeDetail: Upgrade | null = null;

  // ─── Pagination ───
  historyPage = 0;
  historyPageSize = 10;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private svc: ProvisioningService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadDevices();
    this.loadUpgrades();

    if (isPlatformBrowser(this.platformId)) {
      interval(this.POLL_MS)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            let url = `${this.apiUrl}/bandwidth-upgrades/`;
            if (this.filterStatus !== 'all') url += `?status=${this.filterStatus}`;
            return this.http.get<any>(url);
          })
        )
        .subscribe({
          next: (data) => {
            this.upgrades = Array.isArray(data) ? data : (data.results || []);
            this.cdr.detectChanges(); // keep table live during polling
          },
          error: (err) => console.error('Polling error:', err)
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Load routers only ───
  loadDevices(): void {
    this.loadingDevices = true;
    this.api.getAllDevices().subscribe({
      next: (data: any) => {
        const raw = Array.isArray(data) ? data : (data.results || []);
        this.allDevices = raw
          .filter((d: any) => (d.device_type || '').toLowerCase() === 'router')
          .map((d: any) => ({
            device_id:   d.id ?? d.device_id ?? 0,
            ne_name:     d.name ?? d.ne_name ?? '',
            ip_address:  d.loopback_ip ?? d.ip_address ?? '',
            vendor:      d.vendor ?? '',
            device_type: d.device_type ?? 'Router',
            ports:       d.ports || []
          }));
        this.filteredDevicesList = [...this.allDevices];
        this.loadingDevices = false;
      },
      error: () => { this.loadingDevices = false; }
    });
  }

  // ─── Autocomplete ───
  filterDevices(searchTerm: string): void {
    this.syncDone = false;
    this.portOptions = [];
    this.selectedPort = null;
    if (!searchTerm) {
      this.filteredDevicesList = [...this.allDevices];
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredDevicesList = this.allDevices.filter(d =>
      d.ne_name.toLowerCase().includes(term) ||
      d.ip_address.includes(term)
    );
  }

  onDeviceAutoSelected(event: any): void {
    const name = event.option.value as string;
    const device = this.allDevices.find(d => d.ne_name === name);
    if (device) {
      this.selectedDevice = device;
      this.searchQuery = device.ne_name;
      this.syncDone = false;
      this.portOptions = [];
      this.selectedPort = null;
      this.newBandwidth = null;
      this.message = '';
    }
  }

  // ─── Sync router — fetch sub-interfaces from the provisioning API ───
  syncRouter(): void {
    if (!this.selectedDevice) return;
    this.syncingRouter = true;
    this.syncDone = false;
    this.portOptions = [];
    this.selectedPort = null;

    this.svc.fetchInterfaces(this.selectedDevice.device_id).subscribe({
      next: (res: any) => {
        // Show ALL interfaces — both physical (Eth1/0/0) and sub-interfaces (Eth1/0/0.100)
        const all: any[] = Array.isArray(res) ? res : (res.interfaces ?? res.results ?? []);
        this.portOptions = all
          .map((p: any): PortOption => {
            const ifName = p.name || '';
            const desc   = p.description || '';
            const phy    = (p.physical || 'unknown').toLowerCase();
            const proto  = (p.protocol || 'unknown').toLowerCase();
            return {
              label      : desc ? `${ifName} — ${desc}` : ifName,
              interface  : ifName.includes('.') ? ifName.split('.')[0] : ifName,
              vlan       : ifName.includes('.') ? ifName.split('.')[1] : '',
              description: desc,
              physical   : phy,
              protocol   : proto
            };
          });
        this.syncDone = true;
        this.syncingRouter = false;
        if (this.portOptions.length === 0) {
          this.message = 'No interfaces found for this router.';
          this.messageType = 'error';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Failed to sync router interfaces.';
        this.messageType = 'error';
        this.syncingRouter = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** When a port is selected, look up the last known bandwidth from history */
  onPortSelected(): void {
    if (!this.selectedPort || !this.selectedDevice) return;
    const iface = this.selectedPort.interface;
    // Find most recent completed upgrade for this device + interface
    const match = this.upgrades
      .filter(u => u.device_name === this.selectedDevice!.ne_name && u.interface === iface)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    this.knownOldBandwidth = match ? match.new_bandwidth_mbps : null;
  }

  /** Status dot CSS class based on port.physical */
  getIfaceStatusDotClass(port: PortOption): string {
    if (port.physical === 'up')   return 'dot-up';
    if (port.physical === 'down') return 'dot-down';
    return 'dot-unknown';
  }

  // ─── Submit ───
  get canSubmit(): boolean {
    return !!this.selectedDevice && !!this.selectedPort && !!this.newBandwidth && this.newBandwidth > 0;
  }

  submitUpgrade(): void {
    if (!this.canSubmit) return;

    this.submitting = true;
    this.message = '';

    const isUpgrade = this.knownOldBandwidth !== null
      ? this.newBandwidth! > this.knownOldBandwidth
      : null;

    const payload = {
      device_id:          this.selectedDevice!.device_id,
      device_name:        this.selectedDevice!.ne_name,
      device_ip:          this.selectedDevice!.ip_address,
      interface:          this.selectedPort!.interface,
      vlan:               this.selectedPort!.vlan || '',
      customer_name:      this.selectedPort!.description || this.selectedPort!.interface,
      new_bandwidth_mbps: this.newBandwidth,
      old_bandwidth_mbps: this.knownOldBandwidth  // send known old BW so backend stores is_upgrade
    };

    this.http.post<any>(`${this.apiUrl}/bandwidth-upgrade/`, payload).subscribe({
      next: (res) => {
        this.message = `Task queued — ID: ${res.upgrade_id} | Ticket: SWAN-${this.formatDateForTicket(new Date())}-${res.upgrade_id.toString().padStart(4, '0')}`;
        this.messageType = 'success';
        this.submitting = false;
        this.resetForm();
        this.loadUpgrades(); // backend has already saved the record — fetch immediately
      },
      error: (err) => {
        this.message = `Failed: ${err.error?.error || 'Unknown error'}`;
        this.messageType = 'error';
        this.submitting = false;
      }
    });
  }

  resetForm(): void {
    this.selectedDevice = null;
    this.selectedPort = null;
    this.newBandwidth = null;
    this.knownOldBandwidth = null;
    this.portOptions = [];
    this.syncDone = false;
    this.searchQuery = '';
    this.filteredDevicesList = [...this.allDevices];
  }

  // ─── History ───
  loadUpgrades(): void {
    let url = `${this.apiUrl}/bandwidth-upgrades/`;
    if (this.filterStatus !== 'all') url += `?status=${this.filterStatus}`;
    this.http.get<Upgrade[]>(url).subscribe({
      next: (data) => {
        this.upgrades = Array.isArray(data) ? data : ((data as any).results || []);
        this.cdr.detectChanges(); // ensure table re-renders immediately
      },
      error: (err) => console.error('Error loading upgrades:', err)
    });
  }

  onFilterChange(): void {
    this.historyPage = 0;
    this.loadUpgrades();
  }

  get filteredUpgrades(): Upgrade[] {
    let list = this.upgrades;
    if (this.filterStatus !== 'all') {
      list = list.filter(u => u.status === this.filterStatus);
    }
    if (this.searchHistoryQuery) {
      const q = this.searchHistoryQuery.toLowerCase();
      list = list.filter(u =>
        u.device_name.toLowerCase().includes(q) ||
        u.customer_name?.toLowerCase().includes(q) ||
        u.interface.toLowerCase().includes(q) ||
        u.device_ip.includes(q)
      );
    }
    return list;
  }

  get paginatedUpgrades(): Upgrade[] {
    const start = this.historyPage * this.historyPageSize;
    return this.filteredUpgrades.slice(start, start + this.historyPageSize);
  }

  get totalHistoryPages(): number {
    return Math.max(1, Math.ceil(this.filteredUpgrades.length / this.historyPageSize));
  }

  prevHistoryPage(): void {
    if (this.historyPage > 0) this.historyPage--;
  }

  nextHistoryPage(): void {
    if (this.historyPage < this.totalHistoryPages - 1) this.historyPage++;
  }

  // ─── SWAN Ticket helpers ───
  private formatDateForTicket(d: Date): string {
    return d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0');
  }

  generateSwanTicket(upgrade: Upgrade): string {
    const d = new Date(upgrade.created_at);
    return `SWAN-${this.formatDateForTicket(d)}-${upgrade.upgrade_id.toString().padStart(4, '0')}`;
  }

  // ─── Download config ───
  downloadConfig(upgrade: Upgrade): void {
    const content = upgrade.generated_commands;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `upgrade_${upgrade.upgrade_id}.config`;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  }

  // ─── Status helpers ───
  getStatusClass(status: string): string {
    const map: any = {
      completed:   'status-completed',
      in_progress: 'status-in-progress',
      pending:     'status-pending',
      failed:      'status-failed'
    };
    return map[status] || '';
  }

  getStatusIcon(status: string): string {
    const map: any = {
      completed:   'check_circle',
      in_progress: 'sync',
      pending:     'schedule',
      failed:      'error'
    };
    return map[status] || 'help';
  }

  getBandwidthChangeIcon(u: Upgrade): string {
    if (u.is_upgrade === null) return 'swap_horiz';
    return u.is_upgrade ? 'trending_up' : 'trending_down';
  }

  getBandwidthChangeClass(u: Upgrade): string {
    if (u.is_upgrade === null) return 'neutral';
    return u.is_upgrade ? 'upgrade' : 'downgrade';
  }

  viewDetails(upgrade: Upgrade): void {
    this.selectedUpgradeDetail = upgrade;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedUpgradeDetail = null;
  }

  retryUpgrade(upgradeId: number): void {
    if (!confirm('Retry this upgrade?')) return;
    this.http.post(`${this.apiUrl}/bandwidth-upgrades/${upgradeId}/retry/`, {}).subscribe({
      next: () => { this.loadUpgrades(); },
      error: (err) => console.error('Retry failed', err)
    });
  }
}