import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RoutersComponent } from './pages/routers/routers.component';
import { LinksComponent } from './pages/links/links.component';
import { ProvisioningComponent } from './pages/provisioning/provisioning.component';

export const routes: Routes = [
  { path: '',             component: DashboardComponent },
  { path: 'routers',     component: RoutersComponent },
  { path: 'links',       component: LinksComponent },
  { path: 'provisioning', component: ProvisioningComponent },
];