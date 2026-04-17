import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';

interface Router {
  device_id: number;
  ne_name: string;
  ip_address: string;
  vendor: string;
}

interface DeviceInterface {
  interface: string;
  base_interface?: string;
  vlan?: string;
  description: string;
  client_name: string;
  status: string;
  is_available: boolean;
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
    CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatTableModule,
    MatAutocompleteModule
  ],
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit, OnDestroy {
  // API URL
  private readonly BASE_URL = 'http://127.0.0.1:8000';
  private apiUrl = `${this.BASE_URL}/api/provisioning`;

  // Auto-refresh polling (every 10s)
  private pollingInterval: any = null;
  private readonly POLL_MS = 10_000;

  // Wizard state
  step: 'device' | 'interface' | 'configure' = 'device';

  // Selected data
  selectedRouter: Router | null = null;
  selectedInterface: DeviceInterface | null = null;

  // Form data
  customerName = '';
  oldBandwidth: number | null = null;
  newBandwidth: number | null = null;

  // Table columns
  columns: string[] = ['upgrade_id', 'device_name', 'interface', 'customer_name', 'bandwidth', 'is_upgrade', 'status', 'created_at', 'actions'];

  // Data arrays
  allRouters: Router[] = [];
  filteredRoutersList: Router[] = [];
  interfaces: DeviceInterface[] = [];
  upgrades: Upgrade[] = [];

  // Pagination for router grid
  routerPage = 1;
  routerPageSize = 12;

  // Loading states
  loadingRouters = false;
  loadingInterfaces = false;
  submitting = false;

  // Filters
  filterStatus = 'all';
  searchQuery = '';
  searchHistoryQuery = '';

  // Detail modal
  showDetailModal = false;
  selectedUpgradeDetail: Upgrade | null = null;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadRouters();
    this.loadUpgrades();

    // Auto-refresh history table every 10 seconds
    if (isPlatformBrowser(this.platformId)) {
      this.pollingInterval = setInterval(() => this.loadUpgrades(), this.POLL_MS);
    }
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  // ─── Load routers via ApiService (same as provisioning task) ───
  loadRouters(): void {
    this.loadingRouters = true;

    forkJoin({
      routers: this.api.getRouters(),
    }).subscribe({
      next: (data: any) => {
        const raw = Array.isArray(data.routers)
          ? data.routers
          : (data.routers.results || []);

        this.allRouters = raw.map((d: any) => ({
          device_id: d.id ?? d.device_id ?? 0,
          ne_name: d.name ?? d.ne_name ?? '',
          ip_address: d.loopback_ip ?? d.ip_address ?? '',
          vendor: d.vendor ?? ''
        }));

        this.filteredRoutersList = [...this.allRouters];
        this.loadingRouters = false;
      },
      error: (err) => {
        console.error('Error loading routers:', err);
        this.loadingRouters = false;
      }
    });
  }

  loadUpgrades(): void {
    let url = `${this.apiUrl}/bandwidth-upgrades/`;
    if (this.filterStatus !== 'all') {
      url += `?status=${this.filterStatus}`;
    }

    this.http.get<Upgrade[]>(url)
      .subscribe({
        next: (data) => {
          this.upgrades = Array.isArray(data) ? data : ((data as any).results || []);
        },
        error: (err) => { console.error('Error loading upgrades:', err); }
      });
  }

  // ─── Autocomplete filter (called on every keystroke) ───
  filterRouters(searchTerm: string): void {
    this.routerPage = 1; // reset pagination on new search
    if (!searchTerm) {
      this.filteredRoutersList = [...this.allRouters];
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredRoutersList = this.allRouters.filter(r =>
      r.ne_name.toLowerCase().includes(term) ||
      r.ip_address.includes(term)
    );
  }

  // ─── Pagination helpers ───
  get paginatedRouters(): Router[] {
    const start = (this.routerPage - 1) * this.routerPageSize;
    return this.filteredRoutersList.slice(start, start + this.routerPageSize);
  }

  get totalRouterPages(): number {
    return Math.ceil(this.filteredRoutersList.length / this.routerPageSize) || 1;
  }

  prevRouterPage(): void {
    if (this.routerPage > 1) this.routerPage--;
  }

  nextRouterPage(): void {
    if (this.routerPage < this.totalRouterPages) this.routerPage++;
  }

  /** Filtered list for history table */
  get filteredUpgrades(): Upgrade[] {
    if (!this.searchHistoryQuery) return this.upgrades;
    const query = this.searchHistoryQuery.toLowerCase();
    return this.upgrades.filter(u =>
      u.device_name.toLowerCase().includes(query) ||
      u.customer_name.toLowerCase().includes(query) ||
      u.interface.toLowerCase().includes(query) ||
      u.device_ip.includes(query)
    );
  }

  /** Called when user picks a router from the autocomplete dropdown */
  onRouterAutoSelected(event: any): void {
    const selectedName = event.option.value as string;
    const router = this.allRouters.find(r => r.ne_name === selectedName);
    if (router) {
      this.selectRouter(router);
    }
  }

  selectRouter(router: Router): void {
    this.selectedRouter = router;
    this.step = 'interface';
    this.fetchInterfaces();
  }

  fetchInterfaces(): void {
    if (!this.selectedRouter) return;

    this.loadingInterfaces = true;

    const payload: any = {
      device_id: this.selectedRouter.device_id,
      device_name: this.selectedRouter.ne_name,
      device_ip: this.selectedRouter.ip_address
    };

    this.http.post<any>(`${this.apiUrl}/fetch-interfaces/`, payload)
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            // Backend may return a pre-parsed array OR raw text in 'data'
            if (Array.isArray(response.interfaces) && response.interfaces.length > 0) {
              this.interfaces = response.interfaces;
            } else if (response.data) {
              // Parse the raw text table from Celery:
              // "Interface    Status    Description\nGE0/0/1  Up  To_Core\n..."
              this.interfaces = this.parseInterfaceText(response.data);
            } else {
              this.interfaces = [];
            }
          } else {
            alert(`Error: ${response.message || 'Unknown error'}`);
            this.interfaces = [];
          }
          this.loadingInterfaces = false;
        },
        error: (err) => {
          console.error('Error fetching interfaces:', err);
          alert('Failed to retrieve interfaces. Please check the backend connection.');
          this.loadingInterfaces = false;
        }
      });
  }

  /** Parse raw text table from backend into DeviceInterface objects */
  private parseInterfaceText(rawText: string): DeviceInterface[] {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return []; // header only or empty

    // Skip the header line (first line)
    const dataLines = lines.slice(1);

    return dataLines.map(line => {
      // Split on 2+ spaces (columns are separated by multiple spaces)
      const parts = line.split(/\s{2,}/);
      const ifaceName = parts[0] || '';
      const status = parts[1] || '';
      const description = parts.slice(2).join(' ') || '';
      const isUp = status.toLowerCase().includes('up');

      return {
        interface: ifaceName,
        base_interface: ifaceName.split('.')[0], // e.g. GE0/0/1.100 → GE0/0/1
        vlan: ifaceName.includes('.') ? ifaceName.split('.')[1] : undefined,
        description: description,
        client_name: description, // use description as client hint
        status: status,
        is_available: isUp
      } as DeviceInterface;
    });
  }

  selectInterface(iface: DeviceInterface): void {
    if (!iface.is_available) return;

    this.selectedInterface = iface;

    if (iface.client_name) {
      this.customerName = iface.client_name;
    }

    this.step = 'configure';
  }

  submitUpgrade(): void {
    if (!this.selectedRouter || !this.selectedInterface || !this.newBandwidth || !this.customerName) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.newBandwidth <= 0) {
      alert('Bandwidth must be greater than 0');
      return;
    }

    this.submitting = true;

    const payload = {
      device_id: this.selectedRouter.device_id,
      device_name: this.selectedRouter.ne_name,
      device_ip: this.selectedRouter.ip_address,
      interface: this.selectedInterface.base_interface || this.selectedInterface.interface,
      vlan: this.selectedInterface.vlan || '',
      customer_name: this.customerName,
      new_bandwidth_mbps: this.newBandwidth,
      old_bandwidth_mbps: this.oldBandwidth
    };

    this.http.post<any>(`${this.apiUrl}/bandwidth-upgrade/`, payload)
      .subscribe({
        next: (response) => {
          alert(`✅ Upgrade initiated!\nID: ${response.upgrade_id}\nTask: ${response.celery_task_id}`);
          this.resetForm();
          this.loadUpgrades();
          this.submitting = false;
        },
        error: (err) => {
          console.error('Error submitting upgrade:', err);
          alert(`❌ Failed: ${err.error?.error || 'Unknown error'}`);
          this.submitting = false;
        }
      });
  }

  resetForm(): void {
    this.step = 'device';
    this.selectedRouter = null;
    this.selectedInterface = null;
    this.customerName = '';
    this.oldBandwidth = null;
    this.newBandwidth = null;
    this.interfaces = [];
    this.searchQuery = '';
    this.routerPage = 1;
    this.filteredRoutersList = [...this.allRouters];
  }

  goBack(): void {
    if (this.step === 'configure') {
      this.step = 'interface';
    } else if (this.step === 'interface') {
      this.step = 'device';
      this.interfaces = [];
    }
  }

  onFilterChange(): void {
    this.loadUpgrades();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':   return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'pending':     return 'status-pending';
      case 'failed':      return 'status-failed';
      default:            return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed':   return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'pending':     return 'Pending';
      case 'failed':      return 'Failed';
      default:            return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':   return 'check_circle';
      case 'in_progress': return 'sync';
      case 'pending':     return 'schedule';
      case 'failed':      return 'error';
      default:            return 'help';
    }
  }

  retryUpgrade(upgradeId: number): void {
    if (!confirm('Retry this upgrade?')) return;

    this.http.post(`${this.apiUrl}/bandwidth-upgrades/${upgradeId}/retry/`, {})
      .subscribe({
        next: () => {
          alert('✅ Retry initiated');
          this.loadUpgrades();
        },
        error: (err) => {
          console.error('Error retrying:', err);
          alert('❌ Retry failed');
        }
      });
  }

  viewDetails(upgrade: Upgrade): void {
    this.selectedUpgradeDetail = upgrade;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedUpgradeDetail = null;
  }

  getVendorIcon(vendor: string): string {
    if (!vendor) return 'router';
    const v = vendor.toLowerCase();
    if (v.includes('huawei'))  return 'router';
    if (v.includes('cisco'))   return 'settings_ethernet';
    if (v.includes('juniper')) return 'hub';
    return 'router';
  }

  getBandwidthChangeIcon(upgrade: Upgrade): string {
    if (upgrade.is_upgrade === null) return 'swap_horiz';
    return upgrade.is_upgrade ? 'trending_up' : 'trending_down';
  }

  getBandwidthChangeClass(upgrade: Upgrade): string {
    if (upgrade.is_upgrade === null) return 'neutral';
    return upgrade.is_upgrade ? 'upgrade' : 'downgrade';
  }
}