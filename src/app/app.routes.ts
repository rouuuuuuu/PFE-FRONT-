import { Routes } from '@angular/router'; // Njibou e'type Routes men Angular (Import the Routes type for routing config)
import { DashboardComponent } from './pages/dashboard/dashboard.component'; // Composant mta3 e'tableau de bord (Dashboard page component)
import { RoutersComponent } from './pages/routers/routers.component'; // Composant lli ywarri les routeurs (Routers list page component)
import { LinksComponent } from './pages/links/links.component'; // Composant mta3 les liaisons backhaul (Backhaul links page component)
import { ProvisioningDashboardComponent } from './provisioning-dashboard/provisioning-dashboard.component'; // Page principale mta3 provisioning (Main provisioning dashboard)
import { ProvisioningTaskComponent } from './provisioning-task/provisioning-task.component'; // Page bech nexectiwha tache (Task execution automation page)
import { HardwareSummaryComponent } from './pages/hardware-summary/hardware-summary.component'; // Khlasa mta3 l'hardware w stats mte3o (Hardware summary for a router)
import { HardwareDetailsComponent } from './pages/hardware-details/hardware-details.component'; // Tafasil mta3 list components l'hardware (Detailed hardware items list)
import { SwitchesComponent } from './pages/switches/switches.component'; // Page mta3 l'inventory des switches (Switches list page)
import { SwitchSummaryComponent } from './pages/switch-summary/switch-summary.component'; // Summary page mta3 switch wa7ad (Ports summary for a single switch)
import { SwitchPortDetailsComponent } from './pages/switch-port-details/switch-port-details.component'; // Tafasil mta3 ports el switch (Filtered port details for a switch)
import { UpgradeComponent } from './pages/upgrade/upgrade.component';
import { StockDashboardComponent } from './pages/stock-dashboard/stock-dashboard.component';
import { PortReservationComponent } from './pages/port-reservation/port-reservation.component';
import { NetworkTopologyComponent } from './pages/network-topology/network-topology.component';
import { InternetProvisioningComponent } from './pages/internet-provisioning/internet-provisioning.component';
import { VoipProvisioningComponent } from './pages/voip-provisioning/voip-provisioning.component';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant.component'; // Page AI Network Assistant
import { ReportListComponent } from './pages/report-list/report-list.component'; // Page mta3 les rapports PDF mensuels (Monthly PDF reports page)
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent, canActivate: [authGuard, adminGuard] },
  { path: '', component: DashboardComponent, canActivate: [authGuard] }, // Default → dashboard
  { path: 'topology', component: NetworkTopologyComponent, canActivate: [authGuard] },
  { path: 'routers', component: RoutersComponent, canActivate: [authGuard] },
  { path: 'switches', component: SwitchesComponent, canActivate: [authGuard] },
  { path: 'switches/:ip', component: SwitchSummaryComponent, canActivate: [authGuard] }, // Cheman /switches/:ip ytalla3 kholassa mta3 ports (Summary page for a single switch)
  { path: 'switches/:ip/ports/:status', component: SwitchPortDetailsComponent, canActivate: [authGuard] }, // Tafasil mta3 ports b'status (Filtered ports detail page)
  { path: 'routers/:ip', component: HardwareSummaryComponent, canActivate: [authGuard] }, // Cheman yemchi l detail mta3 routeur wa7ad w na3tiweh l'IP (Parametrised path for router summary)
  { path: 'routers/:ip/:component/:status', component: HardwareDetailsComponent, canActivate: [authGuard] }, // Cheman akthar tafasil m3a type u statut (Deep link into hardware statuses)
  { path: 'links', component: LinksComponent, canActivate: [authGuard] }, // Cheman lel backhaul links (Path for all links)
  { path: 'upgrade', component: UpgradeComponent, canActivate: [authGuard] },
  { path: 'ai-assistant', component: AiAssistantComponent, canActivate: [authGuard] }, // Page AI Network Assistant
  { path: 'inventory', component: StockDashboardComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportListComponent, canActivate: [authGuard] }, // Page mta3 les rapports mensuels PDF (Monthly reports list page),

  {
    path: 'provisioning', // Cheman parent mta3 el provisioning (Parent path for provisioning area)
    canActivate: [authGuard],
    children: [ // El routage louled lli ta7tou (Child routes block)
      { path: '', component: ProvisioningDashboardComponent }, // Ken ma famech chay ba3edha ytala3 menu (Default route inside provisioning shows the cards)
      { path: 'task/:taskType', component: ProvisioningTaskComponent }, // yit7all l'formulaire selon l'esem mta3 e'Tache (Dynamic path for each individual provisioning task)
      { path: 'port-reservation', component: PortReservationComponent }, // Nouveau cheman lel reservation des ports
      { path: 'internet-service', component: InternetProvisioningComponent }, // Internet service provisioning wizard
      { path: 'voip-service', component: VoipProvisioningComponent } // VoIP service provisioning wizard
    ]
  }

];