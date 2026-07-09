import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  PLATFORM_ID, Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, FormArray,
  Validators, FormsModule
} from '@angular/forms';
import { interval, Subject, Observable } from 'rxjs';
import { switchMap, takeUntil, startWith, map } from 'rxjs/operators';
import { Clipboard } from '@angular/cdk/clipboard';
import {
  trigger, transition, style, animate
} from '@angular/animations';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { VRF_LIST } from '../../shared/constants/vrf-list';

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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    ClipboardModule,
    TranslateModule,
    MatDialogModule,
    MatAutocompleteModule
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

  // ── VRF options ──────────────────────────────────────────
  vrfList = VRF_LIST;
  filteredVrfs!: Observable<string[]>;

  // ── Conditional visibility ──────────────────────────────
  showManagementIp = false;

  // ── UI state ─────────────────────────────────────────────
  submitting = false;

  // ── Status polling / result panel ────────────────────────
  currentTaskId: number | null = null;
  taskStatus: string | null = null;
  taskResult: string | null = null;
  taskScriptOutput: string | null = null;
  pollingActive = false;
  liberating = false;
  copyDone = false;

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._buildForm();
    this.loadHistory();

    // Restore persisted task state
    const state = this.taskStateService.restore('mpls');
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

  // ── Form builder ─────────────────────────────────────────
  private _buildForm(): void {
    this.form = this.fb.group({
      client_name: ['', Validators.required],
      ip_sim: ['', Validators.required],
      lan_clients: this.fb.array([this.fb.control('', Validators.required)]),
      vrf_client: ['', Validators.required],
      management_ip: ['']
    });

    this.filteredVrfs = this.form.get('vrf_client')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );

    // Watch VRF for management keyword
    this.form.get('vrf_client')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((vrf: string) => {
        const isMgmt = /MNG|MGT/i.test(vrf || '');
        this.showManagementIp = isMgmt;

        const mgmtCtrl = this.form.get('management_ip')!;
        if (isMgmt) {
          mgmtCtrl.setValidators(Validators.required);
        } else {
          mgmtCtrl.clearValidators();
          mgmtCtrl.setValue('');
        }
        mgmtCtrl.updateValueAndValidity();
      });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.vrfList.filter(option => option.toLowerCase().includes(filterValue));
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
    }
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

    const payload: any = {
      task_type: 'mpls',
      parameters: {
        client_name: this.form.get('client_name')!.value,
        ip_sim: this.form.get('ip_sim')!.value,
        lan_clients: this.lanClients.value as string[],
        vrf_client: this.form.get('vrf_client')!.value
      }
    };

    if (this.showManagementIp) {
      payload.parameters.management_ip = this.form.get('management_ip')!.value;
    }

    const validationPayload = {
      task_id: 0,
      task_type: 'mpls',
      router_hostname: '',
      vendor: '',
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
              this._doExecute(payload);
            }
          });
        } else {
          this._doExecute(payload);
        }
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
        const msg = err?.error?.error || err?.error?.detail
          || 'Failed to start MPLS provisioning task.';
        this._toast(msg, 'error');
      }
    });
  }

  // ── Status Polling ────────────────────────────────────────
  private _startStatusPolling(taskId: number): void {
    this.pollingActive = true;
    this.taskStatus = 'pending';
    this.taskResult = null;
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
          this.taskStatus = res?.status ?? 'unknown';
          this.taskResult = res?.result ?? res?.message ?? null;
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
    this.taskScriptOutput = null;
    this.pollingActive = false;
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
    this.form.reset();
    // Re-initialise LAN clients to one empty field
    while (this.lanClients.length > 1) {
      this.lanClients.removeAt(this.lanClients.length - 1);
    }
    this.lanClients.at(0).setValue('');
    this.showManagementIp = false;
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
        (t.parameters?.client_name || '').toLowerCase().includes(q) ||
        (t.parameters?.vrf_client || '').toLowerCase().includes(q)
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
        type === 'error' ? 'error-snackbar' :
          'warn-snackbar';
    this.snackBar.open(msg, '✕', { duration: 4000, panelClass });
  }
}
