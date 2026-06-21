import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, FormsModule, AbstractControl, ValidationErrors
} from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

/** Validates a standard IPv4 address (e.g. 10.0.0.1). Empty value is allowed (field is optional). */
function ipv4Validator(control: AbstractControl): ValidationErrors | null {
  const value: string = (control.value ?? '').trim();
  if (!value) return null; // optional — blank is fine
  const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
  return ipv4Regex.test(value) ? null : { invalidIp: true };
}

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
import { MatAutocompleteModule }       from '@angular/material/autocomplete';

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
    MatAutocompleteModule,
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
  // CIDR subnet type options – value is sent as-is; backend mask_map resolves to decimal notation
  readonly subnetOptions = [
    { value: '/28', label: '/28  (14 hosts — 255.255.255.240)' },
    { value: '/29', label: '/29  (6 hosts  — 255.255.255.248)' },
    { value: '/30', label: '/30  (2 hosts  — 255.255.255.252)' },
    { value: '/31', label: '/31  (P2P      — 255.255.255.254)' }
  ];

  // ── Data ───────────────────────────────────────────────────
  routers    : RouterDevice[]  = [];
  filteredRoutersList: RouterDevice[] = [];  // autocomplete suggestions
  routerSearchQuery   = '';                  // bound to the autocomplete input
  private _skipNextRouterFilter = false;     // guard after selection
  switches   : SwitchDevice[]  = [];
  interfaces : PortInterface[] = [];

  // ── UI state ─────────────────────────────────────────────
  loadingRouters    = false;
  loadingInterfaces = false;   // SYNC_RT spinner
  loadingSwitches   = false;   // SYNC_SW spinner (static list)
  loadingSwitch     = false;   // SYNC_SW live-discovery spinner
  submitting        = false;
  activeNatBtn      : NatMode | null = null;  // which button is spinning

  switchIgnored     = false;   // IGNORE_SW was clicked
  has_switch        = false;   // set by live discovery response

  // ── History ───────────────────────────────────────────────
  historyTasks     : any[]   = [];
  historyLoading   = false;
  filterStatus     = 'all';
  searchQuery      = '';
  historyPage      = 0;
  historyPageSize  = 10;
  historyColumns   : string[] = [
    'task_id', 'device_name', 'client_name',
    'vlan', 'debit_mbps', 'status', 'created_at',
    'swan_ticket', 'download'
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
      nom_client         : ['', Validators.required],
      vlan               : [null, [Validators.required, Validators.min(1), Validators.max(4094)]],
      debit_mbps         : [null, [Validators.required, Validators.min(1)]],
      media_type         : ['FO', Validators.required],
      router_id          : [null, Validators.required],
      router_name        : [''],           // hidden – set on router selection
      interface_name     : [{ value: null, disabled: true }, Validators.required],  // alias for port_name used in SYNC_SW payload
      switch_id          : [{ value: null, disabled: false }],
      switch_ip          : [''],           // auto-populated by SYNC_SW discovery
      switch_port        : [''],           // auto-populated by SYNC_SW discovery
      switch_uplink_port : [''],           // auto-populated by SYNC_SW discovery
      port_name          : [{ value: null, disabled: true }, Validators.required],
      subnet_type        : [null],         // CIDR string e.g. "/30"
      // ── IP addresses (optional – allocated by backend if left blank) ──
      pe_ip_address      : ['', [ipv4Validator]],  // PE-side IP of the P2P link
      ce_ip_address      : ['', [ipv4Validator]]   // CE-side IP of the P2P link
    });

    // Keep interface_name in sync with port_name selection
    this.form.get('port_name')!.valueChanges.subscribe(val => {
      this.form.get('interface_name')!.setValue(val, { emitEvent: false });
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
        this.filteredRoutersList = [...this.routers];
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

  // ── Router autocomplete ─────────────────────────────────────
  filterRouterSuggestions(term: string): void {
    if (this._skipNextRouterFilter) {
      this._skipNextRouterFilter = false;
      return;
    }
    // Clear selected router when user types again
    this.form.patchValue({ router_id: null, router_name: '' });
    this.interfaces = [];
    this.form.get('port_name')!.setValue(null);
    this.form.get('port_name')!.disable();

    if (!term) {
      this.filteredRoutersList = [...this.routers];
      return;
    }
    const lower = term.toLowerCase();
    this.filteredRoutersList = this.routers.filter(r =>
      r.ne_name.toLowerCase().includes(lower) ||
      r.ip_address.includes(lower)
    );
  }

  onRouterSearchFocus(): void {
    if (!this.routerSearchQuery) {
      this.filteredRoutersList = [...this.routers];
    } else {
      const lower = this.routerSearchQuery.toLowerCase();
      this.filteredRoutersList = this.routers.filter(r =>
        r.ne_name.toLowerCase().includes(lower) ||
        r.ip_address.includes(lower)
      );
    }
  }

  onRouterAutoSelected(event: any): void {
    const name   = event.option.value as string;
    const router = this.routers.find(r => r.ne_name === name);
    if (router) {
      this._skipNextRouterFilter = true;
      this.routerSearchQuery = router.ne_name;
      this.filteredRoutersList = [];
      this.form.patchValue({ router_id: router.id, router_name: router.ne_name });
      // Reset interfaces
      this.interfaces = [];
      this.form.get('port_name')!.setValue(null);
      this.form.get('port_name')!.disable();
    }
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

  // ── SYNC_SW — Live LLDP discovery ────────────────────────
  onSyncSwitch(): void {
    const routerId = this.form.get('router_id')!.value as number;
    const portName = this.form.get('port_name')!.value as string;

    if (!routerId || !portName) {
      this._toast('Please select a router and a port first.', 'warn');
      return;
    }

    this.loadingSwitch = true;
    this.has_switch    = false;
    // Clear any previous switch discovery data
    this.form.patchValue({
      switch_ip          : '',
      switch_port        : '',
      switch_uplink_port : ''
    });

    this.svc.fetchSwitchDiscovery(routerId, portName).subscribe({
      next: (response: any) => {
        this.loadingSwitch = false;

        if (response?.has_switch === true) {
          this.has_switch = true;

          // ── Injecter le switch découvert dans le dropdown ─────────────────
          // On utilise l'id fictif -1 pour distinguer les switches découverts
          // dynamiquement de ceux chargés depuis l'inventaire.
          const discoveredSwitch: SwitchDevice = {
            id         : -1,
            name       : response.switch_name ?? response.switch_ip ?? 'Switch LLDP',
            ip_address : response.switch_ip   ?? ''
          };
          // Remplacer la liste par ce seul switch découvert (ou en ajouter d'autres
          // si syncSwitch() a déjà chargé l'inventaire, on filtre l'éventuel -1 précédent)
          this.switches = [
            ...this.switches.filter(s => s.id !== -1),
            discoveredSwitch
          ];

          // Pré-sélectionner ce switch dans le mat-select et renseigner son IP
          const switchCtrl = this.form.get('switch_id')!;
          switchCtrl.enable();
          this.form.patchValue({
            switch_id          : -1,
            switch_ip          : response.switch_ip          ?? '',
            switch_port        : response.switch_port        ?? '',
            switch_uplink_port : response.switch_uplink_port ?? ''
          });
          // ─────────────────────────────────────────────────────────────────

          this._toast(
            response.message ?? '✔ Switch discovered successfully.',
            'success'
          );
        } else {
          this.has_switch = false;
          this.form.patchValue({
            switch_ip          : '',
            switch_port        : '',
            switch_uplink_port : ''
          });
          this._toast(
            'ℹ No switch found on that interface (direct PE ↔ CPE topology).',
            'warn'
          );
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingSwitch = false;
        const msg = err?.error?.error || 'Failed to discover switch.';
        this._toast(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /** Legacy: load switch list from inventory (kept for the SELECT SWITCH dropdown) */
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

  /** IGNORE_SW — disable the switch select, clear all switch discovery data */
  ignoreSwitch(): void {
    this.switchIgnored = true;
    this.has_switch    = false;
    const switchCtrl   = this.form.get('switch_id')!;
    switchCtrl.setValue(null);
    switchCtrl.disable();
    this.form.patchValue({
      switch_ip          : '',
      switch_port        : '',
      switch_uplink_port : ''
    });
  }

  /** When a switch is chosen, store its IP for the payload */
  onSwitchChange(): void {
    const id  = this.form.get('switch_id')!.value;
    // id === -1 → switch découvert via LLDP : switch_ip déjà renseigné par onSyncSwitch()
    if (id === -1) return;
    const sw  = this.switches.find(s => s.id === id);
    this.form.patchValue({ switch_ip: sw?.ip_address ?? '' });
  }

  // ── Submission ────────────────────────────────────────────
  submit(natMode: NatMode): void {
    if (this.submitting) return;

    // Mark all controls touched so validators show errors
    this.form.markAllAsTouched();

    // port_name may be disabled – still need it
    const portVal  = this.form.get('port_name')!.value as string;
    const routerId = this.form.get('router_id')!.value as number;

    if (!portVal) {
      this._toast('Please sync the router and select a port.', 'warn');
      return;
    }

    if (!routerId) {
      this._toast('Please select a router first.', 'warn');
      return;
    }

    // ── Validate IP fields before submitting ────────────────────────────
    const peIpCtrl = this.form.get('pe_ip_address')!;
    const ceIpCtrl = this.form.get('ce_ip_address')!;

    if (peIpCtrl.invalid) {
      this._toast('Adresse IP PE invalide. Veuillez saisir une IPv4 valide ou laisser vide.', 'error');
      return;
    }
    if (ceIpCtrl.invalid) {
      this._toast('Adresse IP CE invalide. Veuillez saisir une IPv4 valide ou laisser vide.', 'error');
      return;
    }

    const peIp = (peIpCtrl.value ?? '').trim() || null;
    const ceIp = (ceIpCtrl.value ?? '').trim() || null;

    // ── Guard: PE and CE IPs must be different if both are provided ──────
    if (peIp && ceIp && peIp === ceIp) {
      this._toast('Les adresses IP PE et CE doivent être différentes.', 'error');
      return;
    }

    this.submitting   = true;
    this.activeNatBtn = natMode;

    // ── Étape 1 : résoudre le port_id numérique depuis la DB ─────────────
    this.api.getPortId(routerId, portVal).subscribe({
      next: (portRes: any) => {
        const portId: number = portRes.port_id;

        // ── Étape 2 : construire le payload complet avec port_id ────────
        const payload = {
          device_name : this.form.get('router_name')!.value,
          task_type   : 'internet',
          parameters  : {
            nom_client         : this.form.get('nom_client')!.value,
            vlan               : Number(this.form.get('vlan')!.value),
            debit_mbps         : Number(this.form.get('debit_mbps')!.value),
            media_type         : this.form.get('media_type')!.value,
            port_name          : portVal,
            port_id            : portId,
            has_switch         : this.has_switch,
            ...(this.has_switch ? {
              switch_ip          : this.form.get('switch_ip')!.value,
              switch_port        : this.form.get('switch_port')!.value,
              switch_uplink_port : this.form.get('switch_uplink_port')!.value
            } : {}),
            nat_mode           : natMode,
            ...(this.form.get('subnet_type')!.value
              ? { subnet_type: this.form.get('subnet_type')!.value }
              : {}),
            // Send IPs only when explicitly provided by the operator;
            // if null, backend auto-allocates from the IP pool.
            ...(peIp ? { pe_ip_address: peIp } : {}),
            ...(ceIp ? { ce_ip_address: ceIp } : {})
          }
        };

        // ── Étape 3 : lancer le POST de provisioning ────────────────────
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
      },

      // ── Erreur lors de la résolution du port_id ──────────────────────
      error: (err: any) => {
        this.submitting   = false;
        this.activeNatBtn = null;
        const msg = err?.error?.message || err?.error?.detail || 'Failed to resolve port ID.';
        this._toast(`Port resolution error: ${msg}`, 'error');
      }
    });
  }

  // ── Reset ─────────────────────────────────────────────────
  private _resetForm(): void {
    this.form.reset({
      media_type    : 'FO',
      pe_ip_address : '',
      ce_ip_address : ''
    });
    this.interfaces        = [];
    this.switches          = [];
    this.switchIgnored     = false;
    this.has_switch        = false;
    this.routerSearchQuery = '';
    this.form.get('port_name')!.disable();
    this.form.get('interface_name')!.disable();
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

  // ── SWAN Ticket helpers ─────────────────────────────────
  private _formatDateForTicket(d: Date): string {
    return d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0');
  }

  generateSwanTicket(task: any): string {
    const d  = new Date(task.created_at);
    const id = (task.task_id ?? task.id ?? 0).toString().padStart(4, '0');
    return `SWAN-${this._formatDateForTicket(d)}-${id}`;
  }

  downloadConfig(task: any): void {
    const ticket  = this.generateSwanTicket(task);
    // Use the raw CLI script returned by the backend; fallback to generated_commands then empty
    const content = task.script_output ?? task.generated_commands ?? '';

    const blob   = new Blob([content], { type: 'text/plain' });
    const url    = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href     = url;
    anchor.download = `${ticket}.txt`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
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
