import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RoutersComponent } from './pages/routers/routers.component';
import { LinksComponent } from './pages/links/links.component';
import { ProvisioningComponent } from './pages/provisioning/provisioning.component';
import { HardwareSummaryComponent } from './pages/hardware-summary/hardware-summary.component';
import { HardwareDetailsComponent } from './pages/hardware-details/hardware-details.component';
export const routes: Routes = [
  { path: '',             component: DashboardComponent },
  { path: 'routers',     component: RoutersComponent },
  { path: 'routers/:ip', component: HardwareSummaryComponent },
 { path: 'routers/:ip/:component/:status', component: HardwareDetailsComponent }, // <-- Enable this line
  { path: 'links',       component: LinksComponent },
  { path: 'provisioning', component: ProvisioningComponent },
];