import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // Njibou les modules de base mta3 Angular (Core modules for component lifecycle and platform check)
import { CommonModule, isPlatformBrowser } from '@angular/common'; // CommonModule fih les directives kima *ngIf wel isPlatformBrowser bech na3rfou ken a7na fil navigateur wala serveur
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Les modules mta3 l'Angular Router pour la navigation bin les pages (to switch views)
import { MatSidenavModule } from '@angular/material/sidenav'; // Njibou composant Sidenav mel Angular Material pour le menu latéral
import { MatToolbarModule } from '@angular/material/toolbar'; // Toolbar mta3 Material bech nasn3ou l'entête (Header bar)
import { MatListModule } from '@angular/material/list'; // MatListModule bech na3mlou liste mta3 les liens fil menu (Navigation links list)
import { MatIconModule } from '@angular/material/icon'; // MatIconModule pour utiliser les icônes Material (nhotou tsawer sghar)

@Component({ // Hedhi décorateur y9oul l'Angular elli l'class hedhi rahi composant (This marks the class as an Angular Component)
  selector: 'app-root', // L'esem mta3 balise HTML bech n3aytou lel composant hedha (The HTML tag for this component)
  standalone: true, // N9oulou elli l'composant hedha standalone, ya3ni ma yesta7a9ech NgModule (Doesn't need a wrapper module)
  imports: [ // Houni n7ottou les modules elli bech nesta3mlouhom fil composant hedha (Dependencies required for this component's template)
    CommonModule, // L'module basique mta3 Angular (Provides common directives like ngIf and ngFor)
    RouterOutlet, RouterLink, RouterLinkActive, // Nécessaires pour el routing wel navigation (Allows the app to have different URLs)
    MatSidenavModule, MatToolbarModule, // Modules Material lel interface (UI elements for layout)
    MatListModule, MatIconModule, // Modules Material lel listes wel icônes (Lists and icons for the menu)
  ],
  templateUrl: './app.component.html', // Fichier HTML elli fih l'interface mta3 l'composant (Path to the HTML template)
  styleUrl: './app.component.css' // Fichier CSS bech nzaynou l'composant (Path to the CSS file)
})
export class AppComponent implements OnInit { // Définition mta3 l'class w n'implémenti l'interface OnInit (Main logic class)
  // State variable to control the dropdown
  isProvisioningOpen = false; // Variable boolean bech nchoufou ken dropdown mta3 provisioning ma7loul wala msaker (Tracks if provisioning menu is open)

  // Theme state
  isDarkMode = true; // Ytabba3 ken theme sombre mfa3el wala lé (True if dark mode is active)
  private isBrowser: boolean; // Variable d'état bech ntiqnou elli a7na fil navigateur mouch serveur (Checks if running on browser)

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { // Constructeur bech n'injectiwo el PLATFORM_ID (Constructor with Dependency Injection)
    this.isBrowser = isPlatformBrowser(this.platformId); // Nvériwiw si l'app texecuti fil browser, bech l'localStorage tekhdem (Avoid SSR errors with localStorage)
  }

  ngOnInit() { // Fonction texecuti awel ma yithal l'composant (Lifecycle hook that runs once at initialization)
    if (this.isBrowser) { // Ken fil navigateur (If we are client-side)
      // Load saved theme preference from localStorage
      const savedTheme = localStorage.getItem('noc-theme'); // Nejbdo l'thème elli msobbinou fel localStorage (Get saved theme from browser storage)
      if (savedTheme === 'light') { // Ken l'utilisateur kan 7atet thème clair (If user previously selected light theme)
        this.isDarkMode = false; // Nbadlou l'variable lel false (Set dark mode state to false)
        document.body.classList.add('light-theme'); // Nzidou class 'light-theme' fel body bech yetbadel l'fond (Apply CSS class for light styling)
      }
    }
  }

  // Toggle function
  toggleProvisioning() { // Fonction bech n7allou walla nsakrou dropdown mta3 tasnif (Function to open/close provisioning menu)
    this.isProvisioningOpen = !this.isProvisioningOpen; // Na3ksou l'valeur mta3 l'variable (Flip the boolean value)
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