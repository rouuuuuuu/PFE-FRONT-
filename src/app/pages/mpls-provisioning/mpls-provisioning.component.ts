import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  PLATFORM_ID, Inject, ElementRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray,
  Validators, FormsModule
} from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  trigger, transition, style, animate
} from '@angular/animations';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ApiService } from '../../services/api.service';
import { ProvisioningService } from '../../services/provisioning.service';
import { AiEngineService } from '../../ai-engine/ai-engine.service';
import { ValidationModalComponent } from '../../ai-engine/validation-modal/validation-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TaskStateService } from '../../services/task-state.service';

@Component({
  selector: 'app-mpls-provisioning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    ClipboardModule,
    TranslateModule,
    MatDialogModule
  ],
  templateUrl: './mpls-provisioning.component.html',
  styleUrls: ['./mpls-provisioning.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ])
  ]
})
export class MplsProvisioningComponent implements OnInit, OnDestroy {

  private readonly POLL_MS = 15_000;
  private readonly STATUS_POLL_MS = 3_000;
  private destroy$ = new Subject<void>();
  private statusPollDestroy$ = new Subject<void>();

  // ── Form ─────────────────────────────────────────────────
  form!: FormGroup;

  // ── Service Type options ─────────────────────────────────
  serviceTypes = [
    { value: 'TDD_MNG',      label: 'TDD Management' },
    { value: 'TDD_MPLS',     label: 'TDD MPLS' },
    { value: 'TDD_INTERNET', label: 'TDD Internet' },
    { value: 'FDD_MPLS',     label: 'FDD MPLS' },
    { value: 'VOIP_TDD',     label: 'VoIP TDD' }
  ];

  // ── VRF / Client options (dynamic) ───────────────────────
  vrfClients: { id: number; vrf_name: string }[] = [];
  filteredVrfClients: { id: number; vrf_name: string }[] = [];
  vrfLoading = false;
  vrfError = '';

  // ── Conditional visibility ──────────────────────────────
  showManagementIp = false;

  // ── LAN duplicate warnings ──────────────────────────────
  lanWarnings: Record<number, string> = {};

  // ── UI state ─────────────────────────────────────────────
  submitting = false;

  // ── Status polling / result panel ────────────────────────
  currentTaskId: number | null = null;
  taskStatus: string | null = null;
  taskResult: string | null = null;
  taskError: string | null = null;
  junosScript: string | null = null;
  pollingActive = false;
  liberating = false;
  copyJunosDone = false;
  private lastValidationId: number | null = null;

  // ── History ───────────────────────────────────────────────
  historyTasks: any[] = [];
  historyLoading = false;
  filterStatus = 'all';
  searchQuery = '';
  historyPage = 0;
  historyPageSize = 10;
  historyColumns: string[] = [
    'task_id', 'client_name', 'vrf_client',
    'status', 'created_at', 'download'
  ];

  private isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private svc: ProvisioningService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private clipboard: Clipboard,
    private aiService: AiEngineService,
    private dialog: MatDialog,
    private taskStateService: TaskStateService,
    private elRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }


  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._buildForm();
    this.loadHistory();
    this._loadVrfClients();

    // Restore persisted task state
    const state = this.taskStateService.restore('mpls');
    if (state) {
      this.form.patchValue(state.formData);
      this.currentTaskId = state.taskId;
      this.taskStatus = state.status;
      if (this.taskStatus === 'SUCCESS') {
        this.pollingActive = false;
      } else if (['PENDING'].includes(this.taskStatus)) {
        if (this.currentTaskId) this._startStatusPolling(this.currentTaskId);
      }
    }

    // Background history polling
    if (isPlatformBrowser(this.platformId)) {
      interval(this.POLL_MS)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.api.getProvisioningTasks())
        )
        .subscribe({
          next: (data: any) => {
            const all = Array.isArray(data) ? data : (data.results || []);
            this.historyTasks = all.filter((t: any) => t.task_type === 'mpls');
            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Polling error:', err)
        });
    }
  }

  ngOnDestroy(): void {
    this.taskStateService.save('mpls', {
      taskId: this.currentTaskId,
      status: this.taskStatus || '',
      formData: this.form.value,
      activeStep: 0,
      deviceName: '',
      taskType: 'mpls',
      completedAt: null
    });

    this.destroy$.next();
    this.destroy$.complete();
    this.statusPollDestroy$.next();
    this.statusPollDestroy$.complete();
  }

  // ── VRF client fetch ──────────────────────────────────────
  _loadVrfClients(): void {
    this.vrfLoading = true;
    this.vrfError = '';
    this.svc.getVrfClients().subscribe({
      next: (clients) => {
        this.vrfClients = clients;
        this._applyVrfFilter();
        this.vrfLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vrfError = 'Failed to load client list. Please refresh.';
        this.vrfLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterVrfClients(query: string = ''): void {
    this._applyVrfFilter(query);
  }

  private _applyVrfFilter(q: string = ''): void {
    const query = (q || '').toLowerCase();
    this.filteredVrfClients = query
      ? this.vrfClients.filter(c => c.vrf_name.toLowerCase().includes(query))
      : [...this.vrfClients];
  }

  // ── Service type change handler ──────────────────────────
  onServiceTypeChange(value: string): void {
    this.showManagementIp = value === 'VOIP_TDD';
    const mngCtrl = this.form.get('mng_ip')!;
    if (this.showManagementIp) {
      mngCtrl.setValidators(Validators.required);
    } else {
      mngCtrl.clearValidators();
      mngCtrl.setValue('');
    }
    mngCtrl.updateValueAndValidity();
  }

  // ── Form builder ─────────────────────────────────────────
  private _buildForm(): void {
    this.form = this.fb.group({
      client_name: ['', Validators.required],
      ipsim: ['', Validators.required],
      lan_clients: this.fb.array([this.fb.control('', Validators.required)]),
      vrf_client: ['', Validators.required],
      service_type: ['', Validators.required],
      mng_ip: ['']
    });

    this.form.get('vrf_client')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(val => {
      this.filterVrfClients(val);
    });
  }

  // ── LAN Clients dynamic array ────────────────────────────
  get lanClients(): FormArray {
    return this.form.get('lan_clients') as FormArray;
  }

  addLanClient(): void {
    this.lanClients.push(this.fb.control('', Validators.required));
  }

  removeLanClient(index: number): void {
    if (this.lanClients.length > 1) {
      this.lanClients.removeAt(index);
      // Clean up warning for removed index
      delete this.lanWarnings[index];
      // Re-index warnings above the removed index
      const updated: Record<number, string> = {};
      for (const [k, v] of Object.entries(this.lanWarnings)) {
        const numKey = Number(k);
        if (numKey > index) {
          updated[numKey - 1] = v;
        } else {
          updated[numKey] = v;
        }
      }
      this.lanWarnings = updated;
    }
  }

  // ── LAN duplicate check (on blur) ────────────────────────
  checkLanDuplicate(index: number): void {
    const value = (this.lanClients.at(index).value || '').trim();
    if (!value) {
      delete this.lanWarnings[index];
      return;
    }

    this.svc.checkMplsLan(value).subscribe({
      next: (res: any) => {
        if (res?.exists) {
          this.lanWarnings[index] = 'This LAN is already provisioned for another client';
        } else {
          delete this.lanWarnings[index];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Silently ignore check errors — non-blocking feature
        delete this.lanWarnings[index];
      }
    });
  }

  // ── Submission ────────────────────────────────────────────
  submit(): void {
    if (this.submitting) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this._toast('Please fill all required fields.', 'warn');
      return;
    }

    this.submitting = true;

    // Build the flat payload — no parameters wrapper, no task_type
    const payload: any = {
      client_name: this.form.get('client_name')!.value,
      ipsim: this.form.get('ipsim')!.value,
      lan_clients: this.lanClients.value as string[],
      vrf_client: this.form.get('vrf_client')!.value,
      service_type: this.form.get('service_type')!.value,
      mng_ip: this.form.get('service_type')!.value === 'VOIP_TDD'
        ? (this.form.get('mng_ip')!.value || null)
        : null
    };

    const validationPayload = {
      task_id: 0,
      task_type: 'mpls',
      router_hostname: this.form.get('client_name')!.value || 'MPLS',
      vendor: 'huawei',
      task_data: payload
    };

    this.aiService.validateTask(validationPayload).subscribe({
      next: (result) => {
        this.lastValidationId = result.id;
        this.submitting = false;
        this.cdr.detectChanges();

        const dialogRef = this.dialog.open(ValidationModalComponent, {
          width: '500px',
          data: {
            result,
            canProceed: result.verdict !== 'blocked'
          }
        });

        dialogRef.afterClosed().subscribe(proceed => {
          if (proceed) {
            this.submitting = true;
            this._doExecute(payload);
          }
        });
      },
      error: () => {
        // AI validation unavailable — proceed anyway
        this._doExecute(payload);
      }
    });
  }

  private _doExecute(payload: any): void {
    this.svc.startMplsProvisioning(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        const id = res?.task_id ?? res?.id ?? null;

        if (id && this.lastValidationId) {
          this.aiService.updateValidationTaskId(this.lastValidationId, id).subscribe();
          this.lastValidationId = null;
        }

        this._toast(
          id
            ? `MPLS task #${id} started successfully.`
            : 'MPLS task submitted successfully.',
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

        // Map per-field 400 validation errors from the backend
        if (err?.status === 400 && err?.error && typeof err.error === 'object') {
          const errors = err.error;
          let hasFieldErrors = false;

          for (const [field, message] of Object.entries(errors)) {
            const ctrl = this.form.get(field);
            if (ctrl) {
              ctrl.setErrors({ serverError: message as string });
              ctrl.markAsTouched();
              hasFieldErrors = true;
            }
          }

          if (hasFieldErrors) {
            this._toast('Please fix the validation errors below.', 'warn');
          } else {
            // Fields not matching form controls — show as generic toast
            const firstMsg = Object.values(errors)[0] as string;
            this._toast(firstMsg || 'Validation error.', 'error');
          }
          this.cdr.detectChanges();
          return;
        }

        const msg = err?.error?.error || err?.error?.detail
          || 'Failed to start MPLS provisioning task.';
        this._toast(msg, 'error');
      }
    });
  }

  // ── Status Polling ────────────────────────────────────────
  private _startStatusPolling(taskId: number): void {
    this.pollingActive = true;
    this.taskStatus = 'PENDING';
    this.taskResult = null;
    this.taskError = null;
    this.junosScript = null;

    this.statusPollDestroy$.next();

    if (!isPlatformBrowser(this.platformId)) return;

    interval(this.STATUS_POLL_MS)
      .pipe(
        takeUntil(this.statusPollDestroy$),
        switchMap(() => this.svc.getMplsResult(taskId))
      )
      .subscribe({
        next: (res: any) => {
          this.taskStatus = res?.status ?? 'PENDING';
          this.cdr.detectChanges();

          if (this.taskStatus === 'SUCCESS') {
            this.pollingActive = false;
            this.junosScript = res?.junos_script ?? null;
            this.taskResult = null;
            this.taskError = null;
            this.statusPollDestroy$.next();
            this.loadHistory();
          } else if (this.taskStatus === 'FAILURE') {
            this.pollingActive = false;
            this.taskError = res?.error ?? 'An unknown error occurred.';
            this.junosScript = null;
            this.statusPollDestroy$.next();
            this.loadHistory();
          }
          // PENDING — keep polling
          this.cdr.detectChanges();
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
    this.svc.liberateMplsTask(this.currentTaskId).subscribe({
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
    this.currentTaskId = null;
    this.taskStatus = null;
    this.taskResult = null;
    this.taskError = null;
    this.junosScript = null;
    this.pollingActive = false;
  }

  /** Copy Junos script output to clipboard */
  copyJunosScript(): void {
    if (!this.junosScript) return;
    this.clipboard.copy(this.junosScript);
    this.copyJunosDone = true;
    setTimeout(() => this.copyJunosDone = false, 2000);
  }


  // ── Reset ─────────────────────────────────────────────
  private _resetForm(): void {
    this.form.reset();
    // Re-initialise LAN clients to one empty field
    while (this.lanClients.length > 1) {
      this.lanClients.removeAt(this.lanClients.length - 1);
    }
    this.lanClients.at(0).setValue('');
    this.showManagementIp = false;
    this.lanWarnings = {};
  }

  // ── History ───────────────────────────────────────────────
  loadHistory(): void {
    this.historyLoading = true;
    this.api.getProvisioningTasks().subscribe({
      next: (data: any) => {
        const all = Array.isArray(data) ? data : (data.results || []);
        this.historyTasks = all.filter((t: any) => t.task_type === 'mpls');
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
        // ProvisioningTask flat fields (new backend format)
        (t.device_name    || '').toLowerCase().includes(q) ||
        (t.device_ip      || '').toLowerCase().includes(q) ||
        // Legacy parameters wrapper (old tasks already in DB)
        (t.parameters?.client_name || '').toLowerCase().includes(q) ||
        (t.parameters?.vrf_client  || '').toLowerCase().includes(q)
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

  // ── SWAN Ticket ───────────────────────────────────────────
  private _formatDateForTicket(d: Date): string {
    return d.getFullYear().toString() +
      (d.getMonth() + 1).toString().padStart(2, '0') +
      d.getDate().toString().padStart(2, '0');
  }

  generateSwanTicket(task: any): string {
    const d = new Date(task.created_at);
    const id = (task.task_id ?? task.id ?? 0).toString().padStart(4, '0');
    return `SWAN-${this._formatDateForTicket(d)}-${id}`;
  }

  downloadConfig(task: any): void {
    const ticket = this.generateSwanTicket(task);
    const content = task.generated_commands ?? task.script_output ?? '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
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
      completed: 'status-completed', SUCCESS: 'status-completed',
      in_progress: 'status-in-progress', PENDING: 'status-pending',
      pending: 'status-pending', failed: 'status-failed',
      FAILURE: 'status-failed'
    };
    return m[s] || '';
  }

  getStatusIcon(s: string): string {
    const m: Record<string, string> = {
      completed: 'check_circle', SUCCESS: 'check_circle',
      in_progress: 'sync', PENDING: 'schedule',
      pending: 'schedule', failed: 'error',
      FAILURE: 'error'
    };
    return m[s] || 'help';
  }

  // ── Toast helper ──────────────────────────────────────────
  private _toast(msg: string, type: 'success' | 'error' | 'warn'): void {
    const panelClass =
      type === 'success' ? 'success-snackbar' :
        type === 'error' ? 'error-snackbar' :
          'warn-snackbar';
    this.snackBar.open(msg, '✕', { duration: 4000, panelClass });
  }
}
