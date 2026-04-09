import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RoutersComponent } from './pages/routers/routers.component';
import { LinksComponent } from './pages/links/links.component';
import { ProvisioningDashboardComponent } from './provisioning-dashboard/provisioning-dashboard.component';
import { ProvisioningTaskComponent } from './provisioning-task/provisioning-task.component';import { HardwareSummaryComponent } from './pages/hardware-summary/hardware-summary.component';
import { HardwareDetailsComponent } from './pages/hardware-details/hardware-details.component';
import { SwitchesComponent } from './pages/switches/switches.component';


export const routes: Routes = [
  { path: '',             component: DashboardComponent },
  { path: 'routers',     component: RoutersComponent },
  { path: 'switches', component: SwitchesComponent },
  { path: 'routers/:ip', component: HardwareSummaryComponent },
  { path: 'routers/:ip/:component/:status', component: HardwareDetailsComponent }, // <-- Enable this line
  { path: 'links',       component: LinksComponent },
{ 
    path: 'provisioning', 
    children: [
      { path: '', component: ProvisioningDashboardComponent }, // The Cards page
      { path: 'task/:taskType', component: ProvisioningTaskComponent } // The specific task automation page
    ]
  }];