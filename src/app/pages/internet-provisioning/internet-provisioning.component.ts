import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';

// ── Custom IP validator ─────────────────────────────────────
function ipAddressValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const ipv4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  return ipv4.test(control.value) ? null : { invalidIp: true };
}

// ── Interfaces ───────────────────────────────────────────────
interface RouterDevice {
  id: number;
  ne_name: string;
  ip_address: string;
  vendor: string;
}

interface PortInterface {
  port_id: number;
  name: string;
  oper_status: string;
  admin_status: string;
  description: string;
}

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
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './internet-provisioning.component.html',
  styleUrls: ['./internet-provisioning.component.css']
})
export class InternetProvisioningComponent implements OnInit, OnDestroy {
  private readonly BASE_URL = 'http://127.0.0.1:8000';
  private destroy$ = new Subject<void>();
  private readonly POLL_MS = 15_000;

  // ── Step Forms ────────────────────────────────────────────
  step1Form!: FormGroup; // Connection type
  step2Form!: FormGroup; // Device selection
  step3Form!: FormGroup; // Interface selection
  step4Form!: FormGroup; // Technical parameters
  step5Form!: FormGroup; // Client info

  // ── Data ─────────────────────────────────────────────────
  routers: RouterDevice[] = [];
  interfaces: PortInterface[] = [];
  selectedInterface: PortInterface | null = null;

  // ── UI State ─────────────────────────────────────────────
  loadingRouters = false;
  loadingInterfaces = false;
  submitting = false;

  message = '';
  messageType: 'success' | 'error' | '' = '';

  // ── History ───────────────────────────────────────────────
  historyTasks: any[] = [];
  historyLoading = false;
  filterStatus = 'all';
  searchHistoryQuery = '';
  historyColumns: string[] = ['task_id', 'device_name', 'client_name', 'vlan', 'debit_mbps', 'status', 'created_at'];

  // ── Pagination ────────────────────────────────────────────
  historyPage = 0;
  historyPageSize = 10;

  readonly subnetTypes = ['/31', '/29'];
  readonly natModes = ['Sans NAT avec CPE', 'Sans NAT sans CPE'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this._buildForms();
    this._loadRouters();
    this.loadHistory();

    // Poll history every 15s
    if (isPlatformBrowser(this.platformId)) {
      interval(this.POLL_MS)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.http.get<any>(`${this.BASE_URL}/api/provisioning/tasks/`))
        )
        .subscribe({
          next: (data) => {
            const all = Array.isArray(data) ? data : (data.results || []);
            this.historyTasks = all.filter((t: any) => t.task_type === 'internet_service');
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Polling error:', err)
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form builders ─────────────────────────────────────────
  private _buildForms(): void {
    this.step1Form = this.fb.group({
      connection_type: ['', Validators.required]
    });

    this.step2Form = this.fb.group({
      device_name: ['', Validators.required]
    });

    this.step3Form = this.fb.group({
      port_id: [null, Validators.required]
    });

    this.step4Form = this.fb.group({
      vlan:          [null, [Validators.required, Validators.min(1), Validators.max(4094)]],
      debit_mbps:    [null, [Validators.required, Validators.min(1)]],
      pe_ip_address: ['',   [Validators.required, ipAddressValidator]],
      subnet_mask:   ['',   [Validators.required, ipAddressValidator]],
      subnet_type:   ['',   Validators.required],
      nat_mode:      ['',   Validators.required],
      ce_ip_address: [''],
      customer_lan_prefix: [''],
      customer_lan_cidr: ['']
    });

    this.step4Form.get('nat_mode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(mode => {
      const isCpe = mode === 'Sans NAT avec CPE';
      const controls = ['ce_ip_address', 'customer_lan_prefix', 'customer_lan_cidr'];
      
      controls.forEach(ctrlName => {
        const ctrl = this.step4Form.get(ctrlName);
        if (isCpe) {
          if (ctrlName === 'ce_ip_address') {
            ctrl?.setValidators([Validators.required, ipAddressValidator]);
          } else {
            ctrl?.setValidators([Validators.required]);
          }
        } else {
          ctrl?.clearValidators();
          ctrl?.setValue('');
        }
        ctrl?.updateValueAndValidity();
      });
    });

    this.step5Form = this.fb.group({
      client_name: ['', [Validators.required, Validators.minLength(2)]]
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
            id:         d.id ?? d.device_id ?? 0,
            ne_name:    d.name ?? d.ne_name ?? '',
            ip_address: d.loopback_ip ?? d.ip_address ?? '',
            vendor:     d.vendor ?? ''
          }));
        this.loadingRouters = false;
      },
      error: () => {
        this.loadingRouters = false;
        this.snackBar.open('Failed to load routers.', 'Close', { duration: 3000 });
      }
    });
  }

  /** Called when a device is chosen */
  onDeviceSelected(): void {
    const deviceName = this.step2Form.value.device_name;
    const router = this.routers.find(r => r.ne_name === deviceName);
    if (!router) return;

    this.interfaces = [];
    this.selectedInterface = null;
    this.step3Form.reset();
    this.loadingInterfaces = true;

    this.api.getUnifiedDevice(router.ip_address).subscribe({
      next: (device: any) => {
        const ports: any[] = device.ports || device.port_details || device.interfaces || [];
        this.interfaces = ports.map((p: any, idx: number) => ({
          port_id:      p.id ?? p.port_id ?? idx,
          name:         p.port_full_name || p.name || `Port ${idx + 1}`,
          oper_status:  p.oper_status || p.status || 'Unknown',
          admin_status: p.admin_status || 'Unknown',
          description:  p.port_description || p.description || ''
        }));
        this.loadingInterfaces = false;
        if (!this.interfaces.length) {
          this.snackBar.open('No interfaces found for this router.', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.loadingInterfaces = false;
        this.snackBar.open('Failed to load interfaces.', 'Close', { duration: 4000 });
      }
    });
  }

  /** Called when user selects a port */
  onInterfaceSelected(portId: number): void {
    this.selectedInterface = this.interfaces.find(i => i.port_id === portId) ?? null;
  }

  // ── Derived state ─────────────────────────────────────────
  get isFormPartiallyFilled(): boolean {
    return !!(
      this.step1Form.value.connection_type ||
      this.step2Form.value.device_name ||
      this.selectedInterface ||
      this.step4Form.value.debit_mbps ||
      this.step5Form.value.client_name
    );
  }

  get canProvision(): boolean {
    return (
      this.step1Form.valid &&
      this.step2Form.valid &&
      this.step3Form.valid &&
      this.step4Form.valid &&
      this.step5Form.valid
    );
  }

  // ── Submission ────────────────────────────────────────────
  provision(): void {
    if (!this.canProvision) return;
    this.submitting = true;
    this.message = '';

    const payload = {
      device_name: this.step2Form.value.device_name,
      task_type:   'internet_service',
      parameters: {
        port_id:       Number(this.step3Form.value.port_id),
        client_name:   this.step5Form.value.client_name,
        vlan:          Number(this.step4Form.value.vlan),
        debit_mbps:    Number(this.step4Form.value.debit_mbps),
        pe_ip_address: this.step4Form.value.pe_ip_address,
        subnet_mask:   this.step4Form.value.subnet_mask,
        subnet_type:   this.step4Form.value.subnet_type,
        
        nat_mode:            this.step4Form.value.nat_mode,
        ...(this.step4Form.value.nat_mode === 'Sans NAT avec CPE' ? {
          ce_ip_address:       this.step4Form.value.ce_ip_address,
          customer_lan_prefix: this.step4Form.value.customer_lan_prefix,
          customer_lan_cidr:   this.step4Form.value.customer_lan_cidr
        } : {})
      }
    };

    this.api.startProvisioning(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        const taskId = res?.task_id ?? res?.id ?? '';
        this.message = `Task queued successfully${taskId ? ' — Task ID: #' + taskId : ''}.`;
        this.messageType = 'success';
        this.resetForm();
        this.loadHistory();
      },
      error: (err: any) => {
        this.submitting = false;
        const msg = err?.error?.error || err?.error?.detail || 'Failed to start provisioning.';
        this.message = msg;
        this.messageType = 'error';
      }
    });
  }

  resetForm(): void {
    this.step1Form.reset();
    this.step2Form.reset();
    this.step3Form.reset();
    this.step4Form.reset();
    this.step5Form.reset();
    this.interfaces = [];
    this.selectedInterface = null;
  }

  // ── History ───────────────────────────────────────────────
  loadHistory(): void {
    this.historyLoading = true;
    this.api.getProvisioningTasks().subscribe({
      next: (data: any) => {
        const all = Array.isArray(data) ? data : (data.results || []);
        this.historyTasks = all.filter((t: any) => t.task_type === 'internet_service');
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

    if (this.searchHistoryQuery) {
      const q = this.searchHistoryQuery.toLowerCase();
      list = list.filter(t =>
        (t.device_name || '').toLowerCase().includes(q) ||
        (t.parameters?.client_name || '').toLowerCase().includes(q) ||
        String(t.parameters?.vlan || '').includes(q)
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

  prevHistoryPage(): void {
    if (this.historyPage > 0) this.historyPage--;
  }

  nextHistoryPage(): void {
    if (this.historyPage < this.totalHistoryPages - 1) this.historyPage++;
  }

  // ── Status helpers ────────────────────────────────────────
  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      completed:   'status-completed',
      in_progress: 'status-in-progress',
      pending:     'status-pending',
      failed:      'status-failed'
    };
    return map[status] || '';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      completed:   'check_circle',
      in_progress: 'sync',
      pending:     'schedule',
      failed:      'error'
    };
    return map[status] || 'help';
  }

  // ── Vendor badge helper ───────────────────────────────────
  getStatusBadge(s: string): string {
    const m: Record<string,string> = { up: 'badge-up', down: 'badge-down' };
    return m[(s||'').toLowerCase()] || 'badge-unknown';
  }
}
