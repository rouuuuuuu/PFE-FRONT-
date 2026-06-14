import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../services/api.service';
import { ProvisioningService } from '../../services/provisioning.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-port-reservation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatAutocompleteModule,
    TranslateModule
  ],
  templateUrl: './port-reservation.component.html',
  styleUrls: ['./port-reservation.component.css']
})
export class PortReservationComponent implements OnInit {
  routers: any[] = [];
  filteredRouters: any[] = [];
  selectedRouter: any = null;
  routerSearchTerm: string = '';
  
  ports: any[] = [];
  selectedPort: any = null;
  
  description: string = '';
  
  loadingRouters: boolean = true;
  loadingPorts: boolean = false;
  submitting: boolean = false;

  // ── History ─────────────────────────────────────────────────
  history: any[] = [];
  loadingHistory: boolean = false;
  historyError: string | null = null;
  historySearch: string = '';

  displayedColumns: string[] = ['name', 'oper_status', 'admin_status', 'action'];

  constructor(
    private api: ApiService,
    private svc: ProvisioningService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRouters();
    this.loadHistory();
  }

  loadRouters(): void {
    this.loadingRouters = true;
    this.api.getAllDevices().subscribe({
      next: (data) => {
        const allDevices = Array.isArray(data) ? data : (data.results || []);
        this.routers = allDevices.filter((d: any) => d.device_type === 'Router' || d.type === 'Router' || d.ne_name);
        this.filteredRouters = this.routers;
        this.loadingRouters = false;
      },
      error: (err) => {
        console.error('Error loading routers:', err);
        this.snackBar.open('Failed to load routers.', 'Close', { duration: 3000 });
        this.loadingRouters = false;
      }
    });
  }

  filterRouters(term: string | any): void {
    const searchStr = typeof term === 'string' ? term : this.displayRouter(term);
    if (!searchStr) {
      this.filteredRouters = this.routers;
      return;
    }
    const search = searchStr.toLowerCase();
    this.filteredRouters = this.routers.filter(r => {
      const name = (r.name || r.ne_name || r.device_name || '').toLowerCase();
      const ip = (r.loopback_ip || r.ip_address || '').toLowerCase();
      return name.includes(search) || ip.includes(search);
    });
  }

  displayRouter(router: any): string {
    if (!router) return '';
    const name = router.name || router.ne_name || router.device_name || router.ip_address;
    const ip = router.loopback_ip || router.ip_address;
    return `${name} (${ip})`;
  }

  onRouterSelected(router: any): void {
    this.selectedRouter = router;
    this.selectedPort = null;
    this.description = '';
    this.ports = [];
  }

  syncRouter(): void {
    if (!this.selectedRouter) return;

    this.loadingPorts = true;
    this.ports = [];
    this.selectedPort = null;

    const routerId = this.selectedRouter.id || this.selectedRouter.device_id;

    this.svc.fetchInterfaces(routerId).subscribe({
      next: (res: any) => {
        // Filter to physical interfaces only (is_subinterface === false)
        const all: any[] = Array.isArray(res) ? res : (res.interfaces ?? res.results ?? []);
        this.ports = all
          .filter((p: any) => p.is_subinterface === false)
          .map((p: any) => ({
            name           : p.name || '',
            physical       : (p.physical || 'unknown').toLowerCase(),
            protocol       : (p.protocol || 'unknown').toLowerCase(),
            description    : p.description || '',
            is_subinterface: false
          }));
        this.loadingPorts = false;
      },
      error: (err) => {
        console.error('Failed to load interfaces', err);
        this.snackBar.open('Failed to load ports for this router.', 'Close', { duration: 3000 });
        this.loadingPorts = false;
      }
    });
  }

  /** A port is available for reservation when it is physically UP */
  isPortDown(port: any): boolean {
    const phy = (port.physical || port.oper_status || port.status || '').toLowerCase();
    return phy === 'up'; // allow selection of UP ports for reservation
  }

  /** Dropdown label: "name" or "name — description" */
  getInterfaceLabel(port: any): string {
    return port.description ? `${port.name} — ${port.description}` : port.name;
  }

  /** CSS class for the status dot */
  getIfaceStatusDotClass(port: any): string {
    const phy = (port.physical || '').toLowerCase();
    if (phy === 'up')   return 'dot-up';
    if (phy === 'down') return 'dot-down';
    return 'dot-unknown';
  }

  selectPort(port: any): void {
    this.selectedPort = port;
  }

  reservePort(): void {
    if (!this.selectedRouter || !this.selectedPort || !this.description.trim()) return;

    this.submitting = true;

    // Step 1: Resolve the real DB port ID (hardware data doesn't carry the integer PK)
    const routerId  = this.selectedRouter.id || this.selectedRouter.device_id;
    const portName  = this.selectedPort.port_full_name || this.selectedPort.interface || this.selectedPort.name;

    this.api.getPortId(routerId, portName).subscribe({
      next: (res: any) => {
        const payload = {
          router_id:   routerId,
          port_id:     res.port_id,   // real integer DB PK
          description: this.description.trim()
        };

        // Step 2: Submit the reservation
        this.api.reservePort(payload).subscribe({
          next: () => {
            this.submitting = false;
            this.snackBar.open('✅ Port reserved. Background configuration started.', 'Close', { duration: 5000 });
            this.resetForm();
            this.loadHistory(); // Refresh history after successful reservation
          },
          error: (err) => {
            this.submitting = false;
            this.snackBar.open(`❌ ${err.error?.message || err.error?.error || 'Failed to reserve port.'}`, 'Close', { duration: 5000 });
          }
        });
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('❌ Could not find port in database. Check port name mapping.', 'Close', { duration: 5000 });
      }
    });
  }

  resetForm(): void {
    this.selectedRouter = null;
    this.routerSearchTerm = '';
    this.selectedPort = null;
    this.description = '';
    this.ports = [];
    this.filteredRouters = this.routers;
  }

  // ── History ─────────────────────────────────────────────────

  loadHistory(): void {
    this.loadingHistory = true;
    this.historyError = null;
    this.api.getPortReservationHistory().subscribe({
      next: (data: any) => {
        this.history = Array.isArray(data) ? data : (data.results ?? []);
        this.loadingHistory = false;
      },
      error: (err) => {
        this.loadingHistory = false;

        if (err.status === 404) {
          // Endpoint not yet available on the backend — treat as empty, not an error
          this.history = [];
          this.historyError = null;
        } else {
          // Real server or network failure
          console.error('Failed to load reservation history:', err);
          this.historyError = 'Could not load history. Please check your connection.';
        }
      }
    });
  }

  get filteredHistory(): any[] {
    if (!this.historySearch.trim()) return this.history;
    const q = this.historySearch.toLowerCase();
    return this.history.filter(h =>
      (h.router_name || h.router || '').toLowerCase().includes(q) ||
      (h.port_name   || h.port   || '').toLowerCase().includes(q) ||
      (h.description || '').toLowerCase().includes(q) ||
      (h.status      || '').toLowerCase().includes(q)
    );
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'done') return 'hist-done';
    if (s === 'failed'    || s === 'error')                   return 'hist-error';
    return 'hist-pending';
  }
}
