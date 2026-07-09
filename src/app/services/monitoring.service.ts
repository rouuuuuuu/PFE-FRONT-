import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MonitoringSummary,
  NetworkHealth,
  ProvisioningStats,
  AiStats,
  PortStats,
  IsisPathResponse
} from '../pages/monitoring/monitoring.models';

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({ providedIn: 'root' })
export class MonitoringService {

  constructor(private http: HttpClient) {}

  /** Full summary — used for initial load */
  getSummary(): Observable<MonitoringSummary> {
    return this.http.get<MonitoringSummary>(`${API_URL}/monitoring/summary/`);
  }

  /** Network health (SSH-based) — heavier call */
  getNetwork(): Observable<NetworkHealth> {
    return this.http.get<NetworkHealth>(`${API_URL}/monitoring/network/`);
  }

  /** Provisioning stats (DB-based) — lightweight */
  getProvisioning(): Observable<ProvisioningStats> {
    return this.http.get<ProvisioningStats>(`${API_URL}/monitoring/provisioning/`);
  }

  /** AI engine stats (DB-based) — lightweight */
  getAi(): Observable<AiStats> {
    return this.http.get<AiStats>(`${API_URL}/monitoring/ai/`);
  }

  /** Port reservation stats (DB-based) — lightweight */
  getPorts(): Observable<PortStats> {
    return this.http.get<PortStats>(`${API_URL}/monitoring/ports/`);
  }

  /** Force an SSH re-poll — admin only */
  refreshNetworkCache(): Observable<any> {
    return this.http.post(`${API_URL}/monitoring/network/refresh/`, {});
  }

  /** Get shortest path using IS-IS */
  getShortestPath(source: string, destination: string): Observable<IsisPathResponse> {
    return this.http.get<IsisPathResponse>(`${API_URL}/monitoring/isis/shortest-path/?source=${source}&destination=${destination}`);
  }
}
