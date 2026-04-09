import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({ 
  providedIn: 'root' 
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  getDashboardStats(): Observable<any> {
    return this.http.get(`${API_URL}/dashboard/stats/`);
  }

  // ==========================================
  // INVENTORY (ROUTERS & SWITCHES)
  // ==========================================
  getRouters(page?: number, search?: string): Observable<any> {
    let params = new HttpParams().set('limit', '500');
    
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(`${API_URL}/routers/`, { params });
  }

  getSwitches(page?: number, search?: string): Observable<any> {
    let params = new HttpParams().set('limit', '500');
    
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(`${API_URL}/switches/`, { params });
  }

  // ==========================================
  // BACKHAUL LINKS
  // ==========================================
  getBackhaulLinks(page: number = 1, search: string = '', alarm: string = ''): Observable<any> {
    let params = new HttpParams().set('page', page.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (alarm) {
      params = params.set('alarm_severity', alarm);
    }

    return this.http.get(`${API_URL}/backhaul/links/`, { params });
  }

  // ==========================================
  // HARDWARE VERIFICATION
  // ==========================================
  verifyDevice(ip: string): Observable<any> {
    return this.http.get(`${API_URL}/hardware/verify/${ip}/`);
  }

  // ==========================================
  // PROVISIONING & AUTOMATION
  // ==========================================
  startProvisioning(data: any): Observable<any> {
    return this.http.post(`${API_URL}/provisioning/start/`, data);
  }

  getProvisioningTasks(): Observable<any> {
    return this.http.get(`${API_URL}/provisioning/tasks/`);
  }

  getProvisioningStatus(taskId: number): Observable<any> {
    return this.http.get(`${API_URL}/provisioning/status/${taskId}/`);
  }
}