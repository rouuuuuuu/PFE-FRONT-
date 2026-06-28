import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // Njibou les modules de base mta3 Angular (Core modules for component lifecycle and platform check)
import { CommonModule, isPlatformBrowser } from '@angular/common'; // CommonModule fih les directives kima *ngIf wel isPlatformBrowser bech na3rfou ken a7na fil navigateur wala serveur
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Les modules mta3 l'Angular Router pour la navigation bin les pages (to switch views)
import { MatSidenavModule } from '@angular/material/sidenav'; // Njibou composant Sidenav mel Angular Material pour le menu latéral
import { MatToolbarModule } from '@angular/material/toolbar'; // Toolbar mta3 Material bech nasn3ou l'entête (Header bar)
import { MatListModule } from '@angular/material/list'; // MatListModule bech na3mlou liste mta3 les liens fil menu (Navigation links list)
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant.component';
import { AuthService } from './services/auth.service';

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
  ],
  templateUrl: './app.component.html', // Fichier HTML elli fih l'interface mta3 l'composant (Path to the HTML template)
  styleUrl: './app.component.css' // Fichier CSS bech nzaynou l'composant (Path to the CSS file)
})
export class AppComponent implements OnInit { // Définition mta3 l'class w n'implémenti l'interface OnInit (Main logic class)
  isProvisioningOpen = false;
  isDarkMode = true;
  sidenavOpen = true;
  isAiDrawerOpen = false; // Controls the AI right-side drawer
  currentLang = 'en';
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private translate: TranslateService,
    public authService: AuthService
  ) { // Constructeur bech n'injectiwo el PLATFORM_ID (Constructor with Dependency Injection)
    this.isBrowser = isPlatformBrowser(this.platformId); // Nvériwiw si l'app texecuti fil browser, bech l'localStorage tekhdem (Avoid SSR errors with localStorage)
    
    // Set default and active languages
    this.translate.setDefaultLang('en');
  }

  ngOnInit() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('noc-theme');
      if (savedTheme === 'light') {
        this.isDarkMode = false;
        document.body.classList.add('light-theme');
      }
      // Restore sidebar preference (default open)
      const savedSidenav = localStorage.getItem('noc-sidenav');
      if (savedSidenav === 'closed') this.sidenavOpen = false;

      // Always enforce English on startup
      this.currentLang = 'en';
      this.translate.use('en');
    }
  }

  // Language toggle
  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'fr' : 'en';
    this.translate.use(this.currentLang);
  }

  toggleProvisioning() { this.isProvisioningOpen = !this.isProvisioningOpen; }

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
    if (this.isBrowser) {
      localStorage.setItem('noc-sidenav', this.sidenavOpen ? 'open' : 'closed');
    }
  }

  // Theme toggle
  toggleTheme() { // Fonction tbadal bin thème k7al w thème fatah (Switches between light and dark themes)
    this.isDarkMode = !this.isDarkMode; // Tbadal état mta3 variable (Toggle boolean)
    if (this.isBrowser) { // Dima nethabbtou a7na fil browser (Ensuring we can use window APIs safely)
      if (this.isDarkMode) { // Ken e'thème jdid sombre (If dark mode is switched on)
        document.body.classList.remove('light-theme'); // Nna7iw class claire (Remove the light theme CSS class)
        localStorage.setItem('noc-theme', 'dark'); // Nsaviou l'choix fel navigateur (Save preference globally)
      } else { // Ken e'thème jdid fatah (If light mode is switched on)
        document.body.classList.add('light-theme'); // Nzidou class d'interface claire (Apply light theme CSS class)
        localStorage.setItem('noc-theme', 'light'); // Nsaviou e'theme jdida (Save preference)
      }
    }
  }
} // Wfet l'class (End of component class)