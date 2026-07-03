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
import { Clipboard } from '@angular/cdk/clipboard';

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
import { ClipboardModule }             from '@angular/cdk/clipboard';
import { MatDialog, MatDialogModule }  from '@angular/material/dialog';

import { ApiService }           from '../../services/api.service';
import { ProvisioningService }  from '../../services/provisioning.service';
import { AiEngineService }      from '../../ai-engine/ai-engine.service';
import { ValidationModalComponent } from '../../ai-engine/validation-modal/validation-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TaskStateService } from '../../services/task-state.service';

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

@Component({
  selector: 'app-voip-provisioning',
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
    ClipboardModule,
    TranslateModule,
    MatDialogModule
  ],
  templateUrl: './voip-provisioning.component.html',
  styleUrls: ['./voip-provisioning.component.css']
})
export class VoipProvisioningComponent implements OnInit, OnDestroy {

  private readonly POLL_MS       = 15_000;
  private readonly STATUS_POLL_MS = 3_000;
  private destroy$               = new Subject<void>();
  private statusPollDestroy$     = new Subject<void>();

  // ── Form ─────────────────────────────────────────────────
  form!: FormGroup;

  // ── Static options ───────────────────────────────────────
  readonly transOptions = [
    { value: 'fo', label: 'FO — Fibre Optique' },
    { value: 'fh', label: 'FH — Faisceau Hertzien' }
  ];

  // ── Data ─────────────────────────────────────────────────
  routers             : RouterDevice[]  = [];
  filteredRoutersList : RouterDevice[]  = [];
  routerSearchQuery   = '';
  private _skipNextRouterFilter = false;

  switches   : SwitchDevice[]  = [];
  interfaces : PortInterface[] = [];

  // ── UI state ─────────────────────────────────────────────
  loadingRouters    = false;
  loadingInterfaces = false;
  loadingSwitch     = false;
  submitting        = false;

  switchIgnored = false;
  has_switch    = false;

  // ── Status polling / result panel ────────────────────────
  currentTaskId      : number | null = null;
  taskStatus         : string | null = null;
  taskResult         : string | null = null;
  taskScriptOutput   : string | null = null;
  pollingActive      = false;
  liberating         = false;
  copyDone           = false;

  // ── History ───────────────────────────────────────────────
  historyTasks    : any[] = [];
  historyLoading  = false;
  filterStatus    = 'all';
  searchQuery     = '';
  historyPage     = 0;
  historyPageSize = 10;
  historyColumns  : string[] = [
    'task_id', 'device_name', 'client_name',
    'vlan', 'status', 'created_at',
    'swan_ticket', 'download'
  ];

  private isBrowser: boolean;

  constructor(
    private fb        : FormBuilder,
    private api       : ApiService,
    private svc       : ProvisioningService,
    private cdr       : ChangeDetectorRef,
    private snackBar  : MatSnackBar,
    private translate : TranslateService,
    private clipboard : Clipboard,
    private aiService : AiEngineService,
    private dialog    : MatDialog,
    private taskStateService: TaskStateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._buildForm();
    this._loadRouters();
    this.loadHistory();

    const state = this.taskStateService.restore('voip');
    if (state) {
      this.form.patchValue(state.formData);
      this.currentTaskId = state.taskId;
      this.taskStatus = state.status;
      if (this.taskStatus === 'completed') {
        this.pollingActive = false;
      } else if (['queued', 'pending', 'running'].includes(this.taskStatus)) {
        if (this.currentTaskId) this._startStatusPolling(this.currentTaskId);
      }
    }

    if (isPlatformBrowser(this.platformId)) {
      interval(this.POLL_MS)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.api.getProvisioningTasks())
        )
        .subscribe({
          next: (data: any) => {
            const all = Array.isArray(data) ? data : (data.results || []);
            this.historyTasks = all.filter((t: any) => t.task_type === 'voip');
            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Polling error:', err)
        });
    }
  }

  ngOnDestroy(): void {
    this.taskStateService.save('voip', {
      taskId: this.currentTaskId,
      status: this.taskStatus || '',
      formData: this.form.value,
      activeStep: 0,
      deviceName: this.form.get('router_name')?.value || '',
      taskType: 'voip',
      completedAt: null
    });

    this.destroy$.next();
    this.destroy$.complete();
    this.statusPollDestroy$.next();
    this.statusPollDestroy$.complete();
  }

  // ── Form builder ─────────────────────────────────────────
  private _buildForm(): void {
    this.form = this.fb.group({
      client_name        : ['', Validators.required],
      vlan               : [null, [Validators.required, Validators.min(1), Validators.max(4094)]],
      pe_ip_address      : ['', Validators.required],
      media_type         : ['fo', Validators.required],
      router_id          : [null, Validators.required],
      router_name        : [''],
      switch_id          : [null],
      switch_ip          : [null],
      switch_port        : [null],
      switch_uplink_port : [null],
      port_name          : [{ value: null, disabled: true }, Validators.required]
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
        this._toast(this.translate.instant('PROVISIONING.TOAST_ROUTERS_FAILED'), 'error');
      }
    });
  }

  // ── Router autocomplete ──────────────────────────────────
  filterRouterSuggestions(term: string): void {
    if (this._skipNextRouterFilter) {
      this._skipNextRouterFilter = false;
      return;
    }
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
      // Reset port & switch on router change
      this.interfaces = [];
      this.switches   = [];
      this.has_switch = false;
      this.switchIgnored = false;
      this.form.get('port_name')!.setValue(null);
      this.form.get('port_name')!.disable();
      this.form.patchValue({ switch_id: null, switch_ip: null, switch_port: null, switch_uplink_port: null });
    }
  }

  // ── SYNC_RT ───────────────────────────────────────────────
  syncRouter(): void {
    const routerId = this.form.get('router_id')!.value;
    if (!routerId) {
      this._toast(this.translate.instant('PROVISIONING.TOAST_SELECT_ROUTER'), 'warn');
      return;
    }

    this.loadingInterfaces = true;
    this.interfaces        = [];
    this.form.get('port_name')!.setValue(null);
    this.form.get('port_name')!.disable();

    this.svc.fetchInterfaces(routerId).subscribe({
      next: (res: any) => {
        const all: any[] = Array.isArray(res) ? res : (res.interfaces ?? res.results ?? []);
        this.interfaces = all
          .filter((p: any) =>
            p.is_subinterface === false &&
            !(p.name || '').includes('.4094')
          )
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
          this._toast(
            this.translate.instant('PROVISIONING.TOAST_IFACES_LOADED', { count: this.interfaces.length }),
            'success'
          );
        } else {
          this._toast(this.translate.instant('PROVISIONING.TOAST_NO_IFACES'), 'warn');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingInterfaces = false;
        const msg = err?.error?.error || this.translate.instant('PROVISIONING.TOAST_IFACES_FAILED');
        this._toast(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── SYNC_SW — LLDP discovery ─────────────────────────────
  onSyncSwitch(): void {
    const routerId = this.form.get('router_id')!.value as number;
    const portName = this.form.get('port_name')!.value as string;

    if (!routerId || !portName) {
      this._toast(this.translate.instant('PROVISIONING.TOAST_SELECT_ROUTER_PORT'), 'warn');
      return;
    }

    this.loadingSwitch = true;
    this.has_switch    = false;
    this.switches      = [];
    this.form.patchValue({ switch_id: null, switch_ip: null, switch_port: null, switch_uplink_port: null });

    this.svc.fetchSwitchDiscovery(routerId, portName).subscribe({
      next: (response: any) => {
        this.loadingSwitch = false;

        if (response?.has_switch === true) {
          this.has_switch = true;
          const discoveredSwitch: SwitchDevice = {
            id         : -1,
            name       : response.switch_name ?? response.switch_ip ?? 'Switch LLDP',
            ip_address : response.switch_ip   ?? ''
          };
          this.switches = [discoveredSwitch];
          this.form.patchValue({
            switch_id          : -1,
            switch_ip          : response.switch_ip          ?? null,
            switch_port        : response.switch_port        ?? null,
            switch_uplink_port : response.switch_uplink_port ?? null
          });
          this._toast(
            response.message ?? this.translate.instant('PROVISIONING.TOAST_SWITCH_FOUND'),
            'success'
          );
        } else {
          this.has_switch = false;
          this._toast(this.translate.instant('PROVISIONING.TOAST_NO_SWITCH'), 'warn');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loadingSwitch = false;
        const msg = err?.error?.error || this.translate.instant('PROVISIONING.TOAST_SWITCH_FAILED');
        this._toast(msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /** IGNORE_SW — clear switch, mark has_switch = false */
  ignoreSwitch(): void {
    this.switchIgnored = true;
    this.has_switch    = false;
    this.switches      = [];
    this.form.patchValue({ switch_id: null, switch_ip: null, switch_port: null, switch_uplink_port: null });
  }

  /** When a switch is manually chosen from the dropdown, store its IP */
  onSwitchChange(): void {
    const id = this.form.get('switch_id')!.value;
    if (id === -1) return; // already populated by LLDP discovery
    const sw = this.switches.find(s => s.id === id);
    this.form.patchValue({ switch_ip: sw?.ip_address ?? null });
  }

  // ── Submission ────────────────────────────────────────────
  submit(): void {
    if (this.submitting) return;

    this.form.markAllAsTouched();

    const portVal    = this.form.get('port_name')!.value as string;
    const routerId   = this.form.get('router_id')!.value as number;

    if (!routerId) {
      this._toast(this.translate.instant('PROVISIONING.TOAST_SELECT_ROUTER'), 'warn');
      return;
    }
    if (!portVal) {
      this._toast(this.translate.instant('PROVISIONING.TOAST_SELECT_ROUTER_PORT'), 'warn');
      return;
    }

    this.submitting = true;

    this.api.getPortId(routerId, portVal).subscribe({
      next: (portRes: any) => {
        const portId: number = portRes.port_id;

        const payload = {
          device_name  : this.form.get('router_name')!.value,
          task_type    : 'voip',
          parameters   : {
            client_name        : this.form.get('client_name')!.value,
            vlan               : Number(this.form.get('vlan')!.value),
            pe_ip_address      : this.form.get('pe_ip_address')!.value,
            media_type         : this.form.get('media_type')!.value,
            port_id            : portId,
            has_switch         : this.has_switch,
            switch_ip          : this.form.get('switch_ip')!.value  ?? '',
            switch_port        : this.form.get('switch_port')!.value ?? '',
            switch_uplink_port : this.form.get('switch_uplink_port')!.value ?? '',
            switch_vendor      : 'juniper'
          }
        };

        const validationPayload = {
          task_id: 0,
          task_type: 'voip',
          router_hostname: this.form.get('router_name')!.value,
          vendor: this.routers.find(r => r.id === routerId)?.vendor || 'huawei',
          task_data: payload
        };

        this.aiService.validateTask(validationPayload).subscribe({
          next: (result) => {
            if (result.verdict === 'blocked' || result.verdict === 'warning') {
              this.submitting = false;
              this.cdr.detectChanges();
              
              const dialogRef = this.dialog.open(ValidationModalComponent, {
                width: '500px',
                data: {
                  result,
                  canProceed: result.verdict === 'warning'
                }
              });

              dialogRef.afterClosed().subscribe(proceed => {
                if (proceed) {
                  this.submitting = true;
                  this.doExecute(payload);
                }
              });
            } else {
              this.doExecute(payload);
            }
          },
          error: () => {
            this.doExecute(payload);
          }
        });
      },
      error: (err: any) => {
        this.submitting = false;
        const msg = err?.error?.message || err?.error?.detail || '';
        this._toast(
          this.translate.instant('PROVISIONING.TOAST_PORT_ERROR', { msg }),
          'error'
        );
      }
    });
  }

  private doExecute(payload: any): void {
    this.svc.startVoipProvisioning(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        const id = res?.task_id ?? res?.id ?? null;
        this._toast(
          id
            ? this.translate.instant('PROVISIONING.TOAST_SUCCESS', { id })
            : this.translate.instant('PROVISIONING.TOAST_SUCCESS_NOID'),
          'success'
        );
        if (id) {
          this.currentTaskId = id;
          this._startStatusPolling(id);
        }
        this._resetForm();
        this.loadHistory();
      },
      error: (err: any) => {
        this.submitting = false;
        const msg = err?.error?.error || err?.error?.detail
          || this.translate.instant('PROVISIONING.TOAST_PROV_FAILED');
        this._toast(msg, 'error');
      }
    });
  }

  // ── Status Polling ────────────────────────────────────────
  private _startStatusPolling(taskId: number): void {
    this.pollingActive   = true;
    this.taskStatus      = 'pending';
    this.taskResult      = null;
    this.taskScriptOutput = null;

    // Stop any previous polling
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

  // ── Liberation ────────────────────────────────────────────
  liberateTask(): void {
    if (!this.currentTaskId || this.liberating) return;

    this.liberating = true;
    this.svc.liberateVoipTask(this.currentTaskId).subscribe({
      next: (res: any) => {
        this.liberating = false;
        this._toast(
          res?.message || 'Libération réussie',
          'success'
        );
        this.loadHistory();
      },
      error: (err: any) => {
        this.liberating = false;
        const msg = err?.error?.error || err?.error?.detail || 'Erreur de libération';
        this._toast(msg, 'error');
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

  // ── Reset ─────────────────────────────────────────────
  private _resetForm(): void {
    this.form.reset({ media_type: 'fo' });
    this.interfaces      = [];
    this.switches        = [];
    this.switchIgnored   = false;
    this.has_switch      = false;
    this.routerSearchQuery = '';
    this.form.get('port_name')!.disable();
  }

  // ── History ───────────────────────────────────────────────
  loadHistory(): void {
    this.historyLoading = true;
    this.api.getProvisioningTasks().subscribe({
      next: (data: any) => {
        const all = Array.isArray(data) ? data : (data.results || []);
        this.historyTasks   = all.filter((t: any) => t.task_type === 'voip');
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
        (t.parameters?.client_name || t.parameters?.nom_client || '').toLowerCase().includes(q) ||
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

  // ── Interface helper ──────────────────────────────────────
  getInterfaceLabel(iface: PortInterface): string {
    return iface.description ? `${iface.name} — ${iface.description}` : iface.name;
  }

  // ── SWAN Ticket ───────────────────────────────────────────
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
    const content = task.generated_commands ?? task.script_output ?? '';
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
