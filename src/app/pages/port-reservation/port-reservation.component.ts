import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-port-reservation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatAutocompleteModule
  ],
  templateUrl: './port-reservation.component.html',
  styleUrls: ['./port-reservation.component.css']
})
export class PortReservationComponent implements OnInit {
  routers: any[] = [];
  filteredRouters: any[] = [];
  selectedRouter: any = null;
  routerSearchTerm: string = '';
  
  ports: any[] = [];
  selectedPort: any = null;
  
  description: string = '';
  
  loadingRouters: boolean = true;
  loadingPorts: boolean = false;
  submitting: boolean = false;

  displayedColumns: string[] = ['name', 'oper_status', 'admin_status', 'action'];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadRouters();
  }

  loadRouters(): void {
    this.loadingRouters = true;
    this.api.getAllDevices().subscribe({
      next: (data) => {
        const allDevices = Array.isArray(data) ? data : (data.results || []);
        this.routers = allDevices.filter((d: any) => d.device_type === 'Router' || d.type === 'Router' || d.ne_name);
        this.filteredRouters = this.routers;
        this.loadingRouters = false;
      },
      error: (err) => {
        console.error('Error loading routers:', err);
        this.snackBar.open('Failed to load routers.', 'Close', { duration: 3000 });
        this.loadingRouters = false;
      }
    });
  }

  filterRouters(term: string | any): void {
    const searchStr = typeof term === 'string' ? term : this.displayRouter(term);
    if (!searchStr) {
      this.filteredRouters = this.routers;
      return;
    }
    const search = searchStr.toLowerCase();
    this.filteredRouters = this.routers.filter(r => {
      const name = (r.ne_name || r.device_name || '').toLowerCase();
      const ip = (r.loopback_ip || r.ip_address || '').toLowerCase();
      return name.includes(search) || ip.includes(search);
    });
  }

  displayRouter(router: any): string {
    if (!router) return '';
    const name = router.ne_name || router.device_name || router.ip_address;
    const ip = router.loopback_ip || router.ip_address;
    return `${name} (${ip})`;
  }

  onRouterSelected(router: any): void {
    this.selectedRouter = router;
    this.selectedPort = null;
    this.description = '';
    
    if (this.selectedRouter) {
      // Step 2: Load ports for the selected router
      // Assuming the API includes a nested 'ports' array, or we fetch them
      if (this.selectedRouter.ports && Array.isArray(this.selectedRouter.ports)) {
        this.ports = this.selectedRouter.ports;
      } else if (this.selectedRouter.interfaces && Array.isArray(this.selectedRouter.interfaces)) {
        // Fallback to interfaces if ports array isn't named 'ports'
        this.ports = this.selectedRouter.interfaces;
      } else {
        // If not nested, fetch device hardware details
        this.loadingPorts = true;
        this.api.getUnifiedDevice(this.selectedRouter.loopback_ip || this.selectedRouter.ip_address).subscribe({
          next: (device) => {
            this.ports = device.ports || device.interfaces || [];
            this.loadingPorts = false;
          },
          error: (err) => {
            console.error('Failed to load port details', err);
            this.snackBar.open('Failed to load ports for this router.', 'Close', { duration: 3000 });
            this.loadingPorts = false;
          }
        });
      }
    } else {
      this.ports = [];
    }
  }

  isPortDown(port: any): boolean {
    const operStatus = (port.oper_status || port.status || '').toLowerCase();
    const adminStatus = (port.admin_status || '').toLowerCase();
    return operStatus === 'down' || adminStatus === 'down';
  }

  selectPort(port: any): void {
    if (this.isPortDown(port)) {
      this.selectedPort = port;
    }
  }

  reservePort(): void {
    if (!this.selectedRouter || !this.selectedPort || !this.description.trim()) {
      return;
    }

    this.submitting = true;
    
    // Construct payload strictly mapping what the user requested, with fallbacks to known properties
    const payload = {
      router_id: this.selectedRouter.id || this.selectedRouter.device_id,
      port_id: this.selectedPort.id || this.selectedPort.port_full_name || this.selectedPort.interface,
      description: this.description.trim()
    };

    this.api.reservePort(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.snackBar.open('✅ Port reserved successfully. Background configuration started.', 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.resetForm();
      },
      error: (err) => {
        this.submitting = false;
        const errorMessage = err.error?.error || 'Failed to reserve port.';
        this.snackBar.open(`❌ Error: ${errorMessage}`, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  resetForm(): void {
    this.selectedRouter = null;
    this.routerSearchTerm = '';
    this.selectedPort = null;
    this.description = '';
    this.ports = [];
    this.filteredRouters = this.routers;
  }
}
