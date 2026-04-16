import { ApplicationConfig } from '@angular/core'; // Njibou e'type mta3 config l'appli (Import ApplicationConfig type)
import { provideRouter } from '@angular/router'; // Fonction bech n7ottou e'routage yekhdem (To enable router functionality)
import { provideHttpClient } from '@angular/common/http'; // Fonction bech njibou l'HTTP client, nkalmou bih l'backend (To enable HTTP requests to external APIs)

import { routes } from './app.routes'; // Njibou thneyet lli 3malnahom f dossier ekhar (Import our defined routes list)
import { provideClientHydration } from '@angular/platform-browser'; // Hydration hiya lli tbadel HTML mta3 serveur lel frontend dynamique (Hydrates server-rendered HTML in browser)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; // Bechi l'animations material yti7ou asynchrone bech may rzinish l'app (Lazy loads animations for Material components)

export const appConfig: ApplicationConfig = { // N7ellou l'objet d'configuration l'application (Export the main app configuration object)
  providers: [ // List mta3 fournisseurs wel services l'koll (List of global providers available everywhere)
    provideRouter(routes), // Nzidiou e'routes (Initialize the router globally)
    provideClientHydration(), // Nzidiou hydration (Enable hydration)
    provideAnimationsAsync(), // Nzidiou l'animations (Enable asynchronous animations)
    provideHttpClient() // Nzidiou HTTP Client ba9i najmou n3aytou lel API (Make HTTP client available for injections)
  ] 
}; // Wfet l'config (End of config object)
