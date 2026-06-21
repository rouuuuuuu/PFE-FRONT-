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
}
