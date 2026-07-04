import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core'; // Njibou les modules de base mta3 Angular (Core modules for component lifecycle and platform check)
import { CommonModule, isPlatformBrowser } from '@angular/common'; // CommonModule fih les directives kima *ngIf wel isPlatformBrowser bech na3rfou ken a7na fil navigateur wala serveur
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Les modules mta3 l'Angular Router pour la navigation bin les pages (to switch views)
import { MatSidenavModule } from '@angular/material/sidenav'; // Njibou composant Sidenav mel Angular Material pour le menu latéral
import { MatToolbarModule } from '@angular/material/toolbar'; // Toolbar mta3 Material bech nasn3ou l'entête (Header bar)
import { MatListModule } from '@angular/material/list'; // MatListModule bech na3mlou liste mta3 les liens fil menu (Navigation links list)
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, interval } from 'rxjs';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant.component';
import { AiPanelComponent } from './pages/ai-panel/ai-panel.component';
import { AuthService } from './services/auth.service';
import { AiEngineService } from './ai-engine/ai-engine.service';
import { PreferencesService } from './services/preferences.service';

@Component({ // Hedhi décorateur y9oul l'Angular elli l'class hedhi rahi composant (This marks the class as an Angular Component)
  selector: 'app-root', // L'esem mta3 balise HTML bech n3aytou lel composant hedha (The HTML tag for this component)
  standalone: true, // N9oulou elli l'composant hedha standalone, ya3ni ma yesta7a9ech NgModule (Doesn't need a wrapper module)
  imports: [ // Houni n7ottou les modules elli bech nesta3mlouhom fil composant hedha (Dependencies required for this component's template)
    CommonModule, // L'module basique mta3 Angular (Provides common directives like ngIf and ngFor)
    RouterOutlet, RouterLink, RouterLinkActive, // Nécessaires pour el routing wel navigation (Allows the app to have different URLs)
    MatSidenavModule, MatToolbarModule,
    MatListModule, MatIconModule, MatTooltipModule, MatMenuModule,
    TranslateModule,
    AiAssistantComponent,
    AiPanelComponent
  ],
  templateUrl: './app.component.html', // Fichier HTML elli fih l'interface mta3 l'composant (Path to the HTML template)
  styleUrl: './app.component.css' // Fichier CSS bech nzaynou l'composant (Path to the CSS file)
})
export class AppComponent implements OnInit, OnDestroy { // Définition mta3 l'class w n'implémenti l'interface OnInit (Main logic class)
  isProvisioningOpen = false;
  isAiEngineOpen = false; // AI Engine sidebar submenu toggle
  sidenavOpen = true;
  isAiDrawerOpen = false; // Controls the AI right-side drawer
  isAiPanelOpen = false; // New state for AI Engine panel
  pendingAiCount = 0; // Badge count for pending AI access requests (admin only)
  hasMonitoringAlerts = false; // Red dot for monitoring nav item
  private isBrowser: boolean;
  private aiPollSub: Subscription | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public authService: AuthService,
    private aiEngineService: AiEngineService,
    public prefService: PreferencesService
  ) { // Constructeur bech n'injectiwo el PLATFORM_ID (Constructor with Dependency Injection)
    this.isBrowser = isPlatformBrowser(this.platformId); // Nvériwiw si l'app texecuti fil browser, bech l'localStorage tekhdem (Avoid SSR errors with localStorage)
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Restore sidebar preference (default open)
      const savedSidenav = localStorage.getItem('noc-sidenav');
      if (savedSidenav === 'closed') this.sidenavOpen = false;

      if (this.authService.isLoggedIn()) {
        this.authService.loadCurrentUser().subscribe();
      }
    }

    // Poll pending AI access requests for admin badge
    if (this.authService.isAdmin()) {
      this.refreshAiPendingCount();
      this.aiPollSub = interval(60000).subscribe(() => this.refreshAiPendingCount());
    }
  }

  ngOnDestroy(): void {
    this.aiPollSub?.unsubscribe();
  }

  private refreshAiPendingCount(): void {
    this.aiEngineService.getAccessRequests('pending').subscribe({
      next: (list) => this.pendingAiCount = list.length,
      error: () => this.pendingAiCount = 0
    });
  }

  toggleProvisioning() { this.isProvisioningOpen = !this.isProvisioningOpen; }
  toggleAiEngine() { this.isAiEngineOpen = !this.isAiEngineOpen; }

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
    if (this.isBrowser) {
      localStorage.setItem('noc-sidenav', this.sidenavOpen ? 'open' : 'closed');
    }
  }
} // Wfet l'class (End of component class)