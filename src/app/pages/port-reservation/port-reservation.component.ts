import { Component, OnInit, OnDestroy, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Clipboard } from '@angular/cdk/clipboard';
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
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ApiService } from '../../services/api.service';
import { ProvisioningService } from '../../services/provisioning.service';
import { TranslateModule } from '@ngx-translate/core';
import { TaskStateService } from '../../services/task-state.service';

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
    ClipboardModule,
    TranslateModule
  ],
  templateUrl: './port-reservation.component.html',
  styleUrls: ['./port-reservation.component.css']
})
export class PortReservationComponent implements OnInit, OnDestroy {

  private readonly POLL_MS        = 15_000;
  private readonly STATUS_POLL_MS = 3_000;
  private destroy$               = new Subject<void>();
  private statusPollDestroy$     = new Subject<void>();

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

  // ── Status polling / result panel ────────────────────────
  currentTaskId      : number | null = null;
  taskStatus         : string | null = null;
  taskResult         : string | null = null;
  taskScriptOutput   : string | null = null;
  pollingActive      = false;
  copyDone           = false;

  // ── History ─────────────────────────────────────────────────
  history: any[] = [];
  loadingHistory: boolean = false;
  historyError: string | null = null;
  historySearch: string = '';
  filterStatus = 'all';
  historyPage = 0;
  historyPageSize = 10;
  historyColumns: string[] = [
    'reservation_id', 'router_name', 'port_name',
    'description', 'status', 'created_at',
    'swan_ticket', 'download'
  ];

  displayedColumns: string[] = ['name', 'oper_status', 'admin_status', 'action'];

  constructor(
    private api: ApiService,
    private svc: ProvisioningService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private clipboard: Clipboard,
    private taskStateService: TaskStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadRouters();
    this.loadHistory();

    const state = this.taskStateService.restore('port_reservation');
    if (state) {
      this.selectedRouter = state.formData.selectedRouter;
      this.selectedPort = state.formData.selectedPort;
      this.description = state.formData.description;
      this.currentTaskId = state.taskId;
      this.taskStatus = state.status;
      if (this.taskStatus === 'completed') {
        this.pollingActive = false;
      } else if (['queued', 'pending', 'running'].includes(this.taskStatus)) {
        if (this.currentTaskId) this._startStatusPolling(this.currentTaskId);
      }
    }

    // ── Polling — keep history table live ──
    if (isPlatformBrowser(this.platformId)) {
      interval(this.POLL_MS)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.api.getPortReservationHistory())
        )
        .subscribe({
          next: (data: any) => {
            this.history = Array.isArray(data) ? data : (data.results ?? []);
            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Polling error:', err)
        });
    }
  }

  ngOnDestroy(): void {
    this.taskStateService.save('port_reservation', {
      taskId: this.currentTaskId,
      status: this.taskStatus || '',
      formData: {
        selectedRouter: this.selectedRouter,
        selectedPort: this.selectedPort,
        description: this.description
      },
      activeStep: 0,
      deviceName: this.selectedRouter?.name || this.selectedRouter?.ne_name || '',
      taskType: 'port_reservation',
      completedAt: null
    });

    this.destroy$.next();
    this.destroy$.complete();
    this.statusPollDestroy$.next();
    this.statusPollDestroy$.complete();
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
            name:           p.name || '',
            physical:       (p.physical || 'unknown').toLowerCase(),
            protocol:       (p.protocol || 'unknown').toLowerCase(),
            description:    p.description || '',
            is_subinterface: false
            // Note: port_id is intentionally NOT mapped here — live interfaces don't have one.
            // The backend will create the DB record on the fly using interface_name.
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

    const routerId      = this.selectedRouter.id || this.selectedRouter.device_id;
    const interfaceName = this.selectedPort.port_full_name || this.selectedPort.interface || this.selectedPort.name;

    // port_id is only present when the port already exists in the DB.
    // For live-fetched interfaces it will be undefined/null — the backend
    // creates the DB record on the fly using interface_name.
    const portId = this.selectedPort.port_id ?? null;

    const payload = {
      router_id:      routerId,
      port_id:        portId,
      interface_name: interfaceName,
      description:    this.description.trim()
    };

    this.api.reservePort(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.snackBar.open('✅ Port reserved. Background configuration started.', 'Close', { duration: 5000 });
        const id = res?.task_id ?? res?.reservation_id ?? res?.id ?? null;
        if (id) {
          this.currentTaskId = id;
          this._startStatusPolling(id);
        }
        this.resetForm();
        this.loadHistory();
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(`❌ ${err.error?.message || err.error?.error || 'Failed to reserve port.'}`, 'Close', { duration: 5000 });
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

  // ── Status Polling ────────────────────────────────────────
  private _startStatusPolling(taskId: number): void {
    this.pollingActive    = true;
    this.taskStatus       = 'pending';
    this.taskResult       = null;
    this.taskScriptOutput = null;

    this.statusPollDestroy$.next();

    if (!isPlatformBrowser(this.platformId)) return;

    interval(this.STATUS_POLL_MS)
      .pipe(
        takeUntil(this.statusPollDestroy$),
        switchMap(() => this.api.getProvisioningStatus(taskId))
      )
      .subscribe({
        next: (res: any) => {
          this.taskStatus       = res?.status ?? 'unknown';
          this.taskResult       = res?.result ?? res?.message ?? null;
          this.taskScriptOutput = res?.script_output ?? res?.generated_commands ?? null;
          this.cdr.detectChanges();

          if (this.taskStatus === 'completed' || this.taskStatus === 'failed') {
            this.pollingActive = false;
            this.statusPollDestroy$.next();
            this.loadHistory();
          }
        },
        error: (err: any) => {
          console.error('Status poll error:', err);
          this.pollingActive = false;
          this.statusPollDestroy$.next();
        }
      });
  }

  /** Dismiss the result panel */
  dismissResult(): void {
    this.currentTaskId    = null;
    this.taskStatus       = null;
    this.taskResult       = null;
    this.taskScriptOutput = null;
    this.pollingActive    = false;
  }

  /** Copy script output to clipboard */
  copyScriptOutput(): void {
    if (!this.taskScriptOutput) return;
    this.clipboard.copy(this.taskScriptOutput);
    this.copyDone = true;
    setTimeout(() => this.copyDone = false, 2000);
  }

  // ── History ─────────────────────────────────────────────────

  loadHistory(): void {
    this.loadingHistory = true;
    this.historyError = null;
    this.api.getPortReservationHistory().subscribe({
      next: (data: any) => {
        this.history = Array.isArray(data) ? data : (data.results ?? []);
        this.loadingHistory = false;
        this.cdr.detectChanges();
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

  onFilterChange(): void {
    this.historyPage = 0;
  }

  get filteredHistory(): any[] {
    let list = this.filterStatus === 'all'
      ? this.history
      : this.history.filter(h => h.status === this.filterStatus);

    if (this.historySearch.trim()) {
      const q = this.historySearch.toLowerCase();
      list = list.filter(h =>
        (h.router_name || h.router || '').toLowerCase().includes(q) ||
        (h.port_name   || h.port   || '').toLowerCase().includes(q) ||
        (h.description || '').toLowerCase().includes(q) ||
        (h.status      || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get paginatedHistory(): any[] {
    const start = this.historyPage * this.historyPageSize;
    return this.filteredHistory.slice(start, start + this.historyPageSize);
  }

  get totalHistoryPages(): number {
    return Math.max(1, Math.ceil(this.filteredHistory.length / this.historyPageSize));
  }

  prevPage(): void { if (this.historyPage > 0) this.historyPage--; }
  nextPage(): void { if (this.historyPage < this.totalHistoryPages - 1) this.historyPage++; }

  // ── SWAN Ticket ─────────────────────────────────────────────
  private formatDateForTicket(d: Date): string {
    return d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0');
  }

  generateSwanTicket(h: any): string {
    const d  = new Date(h.reserved_at || h.created_at);
    const id = (h.reservation_id ?? h.id ?? 0).toString().padStart(4, '0');
    return `SWAN-${this.formatDateForTicket(d)}-${id}`;
  }

  // ── Download Config ─────────────────────────────────────────
  downloadConfig(h: any): void {
    const ticket  = this.generateSwanTicket(h);
    const content = h.generated_commands ?? h.script_output ?? '';
    const blob    = new Blob([content], { type: 'text/plain' });
    const url     = URL.createObjectURL(blob);
    const anchor  = document.createElement('a');
    anchor.href     = url;
    anchor.download = `${ticket}.config`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  // ── Status helpers ──────────────────────────────────────────
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed:   'status-completed',
      success:     'status-completed',
      done:        'status-completed',
      in_progress: 'status-in-progress',
      pending:     'status-pending',
      failed:      'status-failed',
      error:       'status-failed'
    };
    return map[(status || '').toLowerCase()] || 'status-pending';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      completed:   'check_circle',
      success:     'check_circle',
      done:        'check_circle',
      in_progress: 'sync',
      pending:     'schedule',
      failed:      'error',
      error:       'error'
    };
    return map[(status || '').toLowerCase()] || 'help';
  }
}
