import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = 'http://127.0.0.1:8000';

@Injectable({ providedIn: 'root' })
export class ProvisioningService {

  constructor(private http: HttpClient) {}

  /**
   * Fetch the physical interfaces/ports for a given router.
   * POST /api/provisioning/fetch-interfaces/
   * Body: { router_id: number }
   * Returns an array of interface objects.
   */
  fetchInterfaces(routerId: number): Observable<any> {
    return this.http.post<any>(
      `${BASE}/api/provisioning/fetch-interfaces/`,
      { router_id: routerId }
    );
  }

  /**
   * Fetch the list of managed switches from the inventory.
   * GET /api/switches/?limit=500
   */
  fetchSwitches(): Observable<any> {
    return this.http.get<any>(`${BASE}/api/switches/?limit=500`);
  }

  /**
   * Live LLDP discovery: detect the switch connected to a router port.
   * POST /api/provisioning/fetch-switch/
   * Body: { router_id, port_name }
   * Returns: { has_switch, switch_ip, switch_port, switch_uplink_port, message }
   */
  fetchSwitchDiscovery(routerId: number, portName: string): Observable<any> {
    return this.http.post<any>(
      `${BASE}/api/provisioning/fetch-switch/`,
      { router_id: routerId, port_name: portName }
    );
  }

  /**
   * Start an internet-provisioning task.
   * POST /api/provisioning/start/
   */
  startProvisioning(payload: any): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/start/`, payload);
  }

  /**
   * Preview the auto-computed CPE parameters (CE IP & Customer LAN prefix)
   * based on the selected subnet type. The backend generates IP ranges dynamically.
   * GET /api/provisioning/preview-cpe/?subnet_type=/29
   * Returns: { ce_ip_address: string, customer_lan_prefix: string }
   */
  previewCpeParams(subnetType: string): Observable<any> {
    const url = `${BASE}/api/provisioning/preview-cpe/?subnet_type=${encodeURIComponent(subnetType)}`;
    return this.http.get<any>(url);
  }

  /**
   * Start a VoIP provisioning task.
   * POST /api/provisioning/voip/start/
   */
  startVoipProvisioning(payload: any): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/voip/start/`, payload);
  }

  /**
   * Liberate (release) a completed VoIP provisioning task.
   * POST /api/provisioning/voip/liberate/<taskId>/
   */
  liberateVoipTask(taskId: number): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/voip/liberate/${taskId}/`, {});
  }

  /**
   * Liberate (release) a completed Internet provisioning task.
   * POST /api/provisioning/internet/liberate/<taskId>/
   */
  liberateInternetTask(taskId: number): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/internet/liberate/${taskId}/`, {});
  }


  /**
   * Start MPLS Provisioning Task
   * POST /api/provisioning/mpls/start/
   * Exact match of the backend flat JSON contract (no `parameters` wrapper).
   */
  startMplsProvisioning(payload: any): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/mpls/start/`, payload);
  }

  /**
   * Poll the result of an MPLS provisioning task.
   * GET /api/provisioning/mpls/result/<taskId>/
   * Returns: { status: 'PENDING'|'SUCCESS'|'FAILURE', junos_script?, huawei_script?, error? }
   */
  getMplsResult(taskId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/api/provisioning/mpls/result/${taskId}/`);
  }

  /**
   * Check if a LAN CIDR is already provisioned.
   * POST /api/provisioning/mpls/check-lan/
   * Body: { network: "<cidr>" }
   * Returns: { network: "...", exists: true|false }
   */
  checkMplsLan(network: string): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/mpls/check-lan/`, { network });
  }

  /**
   * Liberate (release) a completed MPLS provisioning task.
   * POST /api/provisioning/mpls/liberate/<taskId>/
   */
  liberateMplsTask(taskId: number): Observable<any> {
    return this.http.post<any>(`${BASE}/api/provisioning/mpls/liberate/${taskId}/`, {});
  }

  /**
   * Fetch the dynamic list of VRF/client names.
   * GET /api/provisioning/clients/
   * Returns: [{ id: number, vrf_name: string }, ...]
   * Auth header is added automatically by the auth interceptor.
   */
  getVrfClients(): Observable<{ id: number; vrf_name: string }[]> {
    return this.http.get<{ id: number; vrf_name: string }[]>(
      `${BASE}/api/provisioning/clients/`
    );
  }
}
