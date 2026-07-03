import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AccessRequest,
  ValidationResult,
  RootCauseAnalysis,
  ValidatorStats
} from './ai-engine.models';

const BASE = 'http://127.0.0.1:8000/api/ai';

@Injectable({ providedIn: 'root' })
export class AiEngineService {

  constructor(private http: HttpClient) {}

  // ── Access Control ────────────────────────────────────────────────────────

  getMyAccessStatus(): Observable<AccessRequest> {
    return this.http.get<AccessRequest>(`${BASE}/access/my/`);
  }

  submitAccessRequest(reason: string): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(`${BASE}/access/request/`, { reason });
  }

  getAccessRequests(statusFilter?: string): Observable<AccessRequest[]> {
    let params = new HttpParams();
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<AccessRequest[]>(`${BASE}/access/requests/`, { params });
  }

  reviewRequest(id: number, action: 'approve' | 'refuse', note: string): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(`${BASE}/access/requests/${id}/review/`, {
      action,
      admin_note: note
    });
  }

  // ── Validator ─────────────────────────────────────────────────────────────

  validateTask(payload: {
    task_id: number;
    task_type: string;
    router_hostname: string;
    vendor: string;
    task_data?: any;
  }): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${BASE}/validator/validate/`, payload);
  }

  getValidationResult(taskId: number): Observable<ValidationResult> {
    return this.http.get<ValidationResult>(`${BASE}/validator/result/${taskId}/`);
  }

  getValidationHistory(filters?: {
    task_type?: string;
    vendor?: string;
    limit?: number;
  }): Observable<ValidationResult[]> {
    let params = new HttpParams();
    if (filters?.task_type) params = params.set('task_type', filters.task_type);
    if (filters?.vendor) params = params.set('vendor', filters.vendor);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<ValidationResult[]>(`${BASE}/validator/history/`, { params });
  }

  // ── RCA ───────────────────────────────────────────────────────────────────

  getRcaList(filters?: {
    is_resolved?: boolean;
    cause?: string;
    limit?: number;
  }): Observable<RootCauseAnalysis[]> {
    let params = new HttpParams();
    if (filters?.is_resolved !== undefined) params = params.set('is_resolved', String(filters.is_resolved));
    if (filters?.cause) params = params.set('cause', filters.cause);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<RootCauseAnalysis[]>(`${BASE}/rca/`, { params });
  }

  getRcaDetail(taskId: number): Observable<RootCauseAnalysis> {
    return this.http.get<RootCauseAnalysis>(`${BASE}/rca/${taskId}/`);
  }

  resolveRca(id: number, note: string): Observable<RootCauseAnalysis> {
    return this.http.post<RootCauseAnalysis>(`${BASE}/rca/${id}/resolve/`, {
      resolution_note: note
    });
  }

  /** Used by provisioning integration to auto-create an RCA on task failure */
  createRca(payload: {
    task_id: number;
    task_type: string;
    router_hostname: string;
    vendor: string;
    error_message: string;
    traceback_excerpt?: string;
    failed_command?: string;
    failure_step?: string;
  }): Observable<RootCauseAnalysis> {
    return this.http.post<RootCauseAnalysis>(`${BASE}/rca/create/`, payload);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats(): Observable<ValidatorStats> {
    return this.http.get<ValidatorStats>(`${BASE}/stats/`);
  }
}
