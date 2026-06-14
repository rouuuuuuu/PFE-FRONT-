import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, FormsModule
} from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { MatCardModule }              from '@angular/material/card';
import { MatFormFieldModule }          from '@angular/material/form-field';
import { MatInputModule }              from '@angular/material/input';
import { MatSelectModule }             from '@angular/material/select';
import { MatButtonModule }             from '@angular/material/button';
import { MatIconModule }               from '@angular/material/icon';
import { MatProgressSpinnerModule }    from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule }              from '@angular/material/table';
import { MatTooltipModule }            from '@angular/material/tooltip';

import { ApiService }           from '../../services/api.service';
import { ProvisioningService }  from '../../services/provisioning.service';
import { TranslateModule }      from '@ngx-translate/core';

// ── Interfaces ───────────────────────────────────────────────
interface RouterDevice {
  id: number;
  ne_name: string;
  ip_address: string;
  vendor: string;
}

interface SwitchDevice {
  id: number;
  name: string;
  ip_address: string;
}

interface PortInterface {
  name: string;
  physical: string;
  protocol: string;
  description: string;
  is_subinterface: boolean;
}

/** One of the 3 NAT-mode actions the user can choose */
type NatMode = 'sans_nat_avec_cpe' | 'sans_nat_sans_cpe';

@Component({
  selector: 'app-internet-provisioning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './internet-provisioning.component.html',
  styleUrls: ['./internet-provisioning.component.css']
})
export class InternetProvisioningComponent implements OnInit, OnDestroy {

  private readonly BASE_URL  = 'http://127.0.0.1:8000';
  private readonly POLL_MS   = 15_000;
  private destroy$           = new Subject<void>();

  // ── Form ─────────────────────────────────────────────────
  form!: FormGroup;

  // ── Static options ───────────────────────────────────────
  readonly transOptions  = [
    { value: 'FO', label: 'FO — Fibre Optique' },
    { value: 'FH', label: 'FH — Faisceau Hertzien' }
  ];
  // Dummy public IP ranges – backend will validate / allocate
  readonly publicRanges  = [
    '196.203.0.0/24',
    '196.203.1.0/24',
    '196.203.2.0/24',
    '41.226.0.0/24',
    '41.226.1.0/24'
  ];

  // ── Data ─────────────────────────────────────────────────
  routers    : RouterDevice[]  = [];
  switches   : SwitchDevice[]  = [];
  interfaces : PortInterface[] = [];

  // ── UI state ─────────────────────────────────────────────
  loadingRouters    = false;
  loadingInterfaces = false;   // SYNC_RT spinner
  loadingSwitches   = false;   // SYNC_SW spinner
  submitting        = false;
  activeNatBtn      : NatMode | null = null;  // which button is spinning

  switchIgnored     = false;   // IGNORE_SW was clicked

  // ── History ───────────────────────────────────────────────
  historyTasks     : any[]   = [];
  historyLoading   = false;
  filterStatus     = 'all';
  searchQuery      = '';
  historyPage      = 0;
  historyPageSize  = 10;
  historyColumns   : string[] = [
    'task_id', 'device_name', 'client_name',
    'vlan', 'debit_mbps', 'status', 'created_at'
  ];

  constructor(
    private fb       : FormBuilder,
    private api      : ApiService,
    private svc      : ProvisioningService,
    private cdr      : ChangeDetectorRef,
    private snackBar : MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._buildForm();
    this._loadRouters();
    this.loadHistory();

    if (isPlatformBrowser(this.platformId)) {
      interval(this.POLL_MS)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.api.getProvisioningTasks())
        )
        .subscribe({
          next: (data: any) => {
            const all = Array.isArray(data) ? data : (data.results || []);
            this.historyTasks = all.filter((t: any) => t.task_type === 'internet');
            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Polling error:', err)
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form builder ─────────────────────────────────────────
  private _buildForm(): void {
    this.form = this.fb.group({
      nom_client   : ['', Validators.required],
      vlan         : [null, [Validators.required, Validators.min(1), Validators.max(4094)]],
      debit_mbps   : [null, [Validators.required, Validators.min(1)]],
      media_type   : ['FO', Validators.required],
      router_id    : [null, Validators.required],
      router_name  : [''],           // hidden – set on router selection
      switch_id    : [{ value: null, disabled: false }],
      switch_ip    : [''],
      port_name    : [{ value: null, disabled: true }, Validators.required],
      public_range : [null]
    });
  }

  // ── Routers ───────────────────────────────────────────────
  private _loadRouters(): void {
    this.loadingRouters = true;
    this.api.getAllDevices().subscribe({
      next: (data: any) => {
        const raw = Array.isArray(data) ? data : (data.results || []);
        this.routers = raw
          .filter((d: any) => (d.device_type || '').toLowerCase() === 'router')
          .map((d: any) => ({
            id         : d.id ?? d.device_id ?? 0,
            ne_name    : d.name ?? d.ne_name ?? '',
            ip_address : d.loopback_ip ?? d.ip_address ?? '',
            vendor     : d.vendor ?? ''
          }));
        this.loadingRouters = false;
      },
      error: () => {
        this.loadingRouters = false;
        this._toast('Failed to load routers.', 'error');
      }
    });
  }

  /** Store router_name alongside router_id for payload */
  onRouterChange(): void {
    const id     = this.form.get('router_id')!.value;
    const router = this.routers.find(r => r.id === id);
    this.form.patchValue({ router_name: router?.ne_name ?? '' });
    // Reset port on router change
    this.interfaces = [];
    this.form.get('port_name')!.setValue(null);
    this.form.get('port_name')!.disable();
  }

  // ── SYNC_RT ───────────────────────────────────────────────
  syncRouter(): void {
    const routerId = this.form.get('router_id')!.value;
    if (!routerId) {
      this._toast('Please select a router first.', 'warn');
      return;
    }

    this.loadingInterfaces = true;
    this.interfaces        = [];
    this.form.get('port_name')!.setValue(null);
    this.form.get('port_name')!.disable();

    this.svc.fetchInterfaces(routerId).subscribe({
      next: (res: any) => {
        // Store only physical interfaces (is_subinterface === false)
        const all: any[] = Array.isArray(res) ? res : (res.interfaces ?? res.results ?? []);
        this.interfaces = all
          .filter((p: any) => p.is_subinterface === false)
          .map((p: any): PortInterface => ({
            name           : p.name || '',
            physical       : (p.physical || 'unknown').toLowerCase(),
            protocol       : (p.protocol || 'unknown').toLowerCase(),
            description    : p.description || '',
            is_subinterface: false
          }));
        this.loadingInterfaces = false;

        if (this.interfaces.length) {
          this.form.get('port_name')!.enable();
          this._toast(`${this.interfaces.length} interfaces loaded.`, 'success');
        } else {
          this._toast('No interfaces returned by router.', 'warn');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingInterfaces = false;
        const msg = err?.error?.error || 'Failed to fetch interfaces.';
        this._toast(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── SYNC_SW ───────────────────────────────────────────────
  syncSwitch(): void {
    this.switchIgnored   = false;
    this.loadingSwitches = true;

    const switchCtrl = this.form.get('switch_id')!;
    switchCtrl.enable();
    switchCtrl.setValue(null);

    this.svc.fetchSwitches().subscribe({
      next: (data: any) => {
        const raw = Array.isArray(data) ? data : (data.results || []);
        this.switches = raw.map((s: any) => ({
          id         : s.id,
          name       : s.name ?? s.ne_name ?? s.hostname ?? '',
          ip_address : s.ip_address ?? s.loopback_ip ?? ''
        }));
        this.loadingSwitches = false;
        this._toast(`${this.switches.length} switches loaded.`, 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingSwitches = false;
        this._toast('Failed to load switches.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /** IGNORE_SW — disable the switch select and clear its value */
  ignoreSwitch(): void {
    this.switchIgnored = true;
    const switchCtrl   = this.form.get('switch_id')!;
    switchCtrl.setValue(null);
    switchCtrl.disable();
    this.form.patchValue({ switch_ip: '' });
  }

  /** When a switch is chosen, store its IP for the payload */
  onSwitchChange(): void {
    const id  = this.form.get('switch_id')!.value;
    const sw  = this.switches.find(s => s.id === id);
    this.form.patchValue({ switch_ip: sw?.ip_address ?? '' });
  }

  // ── Submission ────────────────────────────────────────────
  submit(natMode: NatMode): void {
    if (this.submitting) return;

    // Mark all controls touched so validators show errors
    this.form.markAllAsTouched();

    // port_name may be disabled – still need it
    const portVal = this.form.get('port_name')!.value;
    if (!portVal) {
      this._toast('Please sync the router and select a port.', 'warn');
      return;
    }

    const switchId = this.form.get('switch_id')!.value;
    const hasSwitch = !this.switchIgnored && !!switchId;

    const payload = {
      device_name : this.form.get('router_name')!.value,
      task_type   : 'internet',
      parameters  : {
        nom_client  : this.form.get('nom_client')!.value,
        vlan        : Number(this.form.get('vlan')!.value),
        debit_mbps  : Number(this.form.get('debit_mbps')!.value),
        media_type  : this.form.get('media_type')!.value,
        port_name   : portVal,
        has_switch  : hasSwitch,
        ...(hasSwitch ? { switch_ip: this.form.get('switch_ip')!.value } : {}),
        nat_mode    : natMode,
        ...(this.form.get('public_range')!.value
          ? { public_range: this.form.get('public_range')!.value }
          : {})
      }
    };

    this.submitting   = true;
    this.activeNatBtn = natMode;

    this.svc.startProvisioning(payload).subscribe({
      next: (res: any) => {
        this.submitting   = false;
        this.activeNatBtn = null;
        const id = res?.task_id ?? res?.id ?? '';
        this._toast(
          `✔ Provisioning queued${id ? ' — Task #' + id : ''}.`,
          'success'
        );
        this._resetForm();
        this.loadHistory();
      },
      error: (err: any) => {
        this.submitting   = false;
        this.activeNatBtn = null;
        const msg = err?.error?.error || err?.error?.detail || 'Provisioning failed.';
        this._toast(msg, 'error');
      }
    });
  }

  // ── Reset ─────────────────────────────────────────────────
  private _resetForm(): void {
    this.form.reset({
      media_type : 'FO'
    });
    this.interfaces   = [];
    this.switches     = [];
    this.switchIgnored = false;
    this.form.get('port_name')!.disable();
    this.form.get('switch_id')!.enable();
  }

  // ── History ───────────────────────────────────────────────
  loadHistory(): void {
    this.historyLoading = true;
    this.api.getProvisioningTasks().subscribe({
      next: (data: any) => {
        const all = Array.isArray(data) ? data : (data.results || []);
        this.historyTasks   = all.filter((t: any) => t.task_type === 'internet');
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.historyLoading = false; }
    });
  }

  get filteredHistory(): any[] {
    let list = this.filterStatus === 'all'
      ? this.historyTasks
      : this.historyTasks.filter(t => t.status === this.filterStatus);

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(t =>
        (t.device_name || '').toLowerCase().includes(q) ||
        (t.parameters?.nom_client || t.parameters?.client_name || '').toLowerCase().includes(q) ||
        String(t.parameters?.vlan || '').includes(q)
      );
    }
    return list;
  }

  get paginatedHistory(): any[] {
    const s = this.historyPage * this.historyPageSize;
    return this.filteredHistory.slice(s, s + this.historyPageSize);
  }

  get totalHistoryPages(): number {
    return Math.max(1, Math.ceil(this.filteredHistory.length / this.historyPageSize));
  }

  prevPage(): void { if (this.historyPage > 0) this.historyPage--; }
  nextPage(): void { if (this.historyPage < this.totalHistoryPages - 1) this.historyPage++; }

  // ── Interface helpers ─────────────────────────────────────
  /** Returns the label shown in the dropdown: "name" or "name — description" */
  getInterfaceLabel(iface: PortInterface): string {
    return iface.description ? `${iface.name} — ${iface.description}` : iface.name;
  }

  /** Returns the CSS class for the status dot based on iface.physical */
  getIfaceStatusDotClass(iface: PortInterface): string {
    const phy = (iface.physical || '').toLowerCase();
    if (phy === 'up')   return 'dot-up';
    if (phy === 'down') return 'dot-down';
    return 'dot-unknown';
  }

  // ── Status helpers ────────────────────────────────────────
  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      completed: 'status-completed', in_progress: 'status-in-progress',
      pending: 'status-pending', failed: 'status-failed'
    };
    return m[s] || '';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      completed: 'check_circle', in_progress: 'sync',
      pending: 'schedule', failed: 'error'
    };
    return m[s] || 'help';
  }

  // ── Toast helper ──────────────────────────────────────────
  private _toast(msg: string, type: 'success' | 'error' | 'warn'): void {
    const panelClass =
      type === 'success' ? 'success-snackbar' :
      type === 'error'   ? 'error-snackbar'   :
                           'warn-snackbar';
    this.snackBar.open(msg, '✕', { duration: 4000, panelClass });
  }
}
