import { Component, OnInit } from '@angular/core'; // Njibou l'Component w OnInit mel blasa principale (Import core decorators and lifecycle interfaces)
import { CommonModule } from '@angular/common'; // CommonModule bech nakhdmou bi ngIf wella ngFor (Import for common Angular directives)
import { MatTableModule } from '@angular/material/table'; // Module mta3 tableaux Material (Import for data tables)
import { MatCardModule } from '@angular/material/card'; // Module mta3 wrak Material (Import for card layouts)
import { MatChipsModule } from '@angular/material/chips'; // Module lel chips/badges (Import for chips/badges)
import { MatInputModule } from '@angular/material/input'; // Module lel inputs (Import for text inputs)
import { MatFormFieldModule } from '@angular/material/form-field'; // Module lel les formulaires (Import for form field wrappers)
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Module lel chargement (Import for loading spinners)
import { MatSelectModule } from '@angular/material/select'; // Module lel listes déroulantes (Import for select dropdowns)
import { FormsModule } from '@angular/forms'; // Module mta3 ngModel (Import to use ngModel for two-way binding)
import { ApiService } from '../../services/api.service'; // Service mte3na w bech nkalmou API (Our custom service to fetch data)
import { Router } from '@angular/router'; // <-- Router imported bech nbadlou e'route (Import Router for programmatic navigation)

@Component({ // Décorateur jdid lli ykhalliha composant (Decorates class as a component)
  selector: 'app-routers', // Nom de balise bech nhottouh fl HTML (The tag used to embed this component)
  standalone: true, // Hedha composant mayesta7a9ech NgModule (Indicates this component imports its own dependencies)
  imports: [ // L'imports l'koll bech nesta3mlouhom houni (Array of modules used in this template)
    CommonModule, MatTableModule, MatCardModule, // Modules base wel layout (Base and layout modules)
    MatChipsModule, MatInputModule, MatFormFieldModule, // Modules des formulaires (Form and input modules)
    MatProgressSpinnerModule, MatSelectModule, FormsModule, // Modules des selecteurs wel spinners (Select, spinner, and forms modules)
  ],
  templateUrl: './routers.component.html', // Fichier HTML associé (Link to the HTML structure file)
  styleUrl: './routers.component.css' // Fichier CSS lel styling (Link to the CSS styling file)
})
export class RoutersComponent implements OnInit { // Class tebda tetexecuta (Component class definition)
  routers: any[] = []; // Tableau bech nhottou fih routeurs lkoll (Array to load all routers from API)
  filteredRouters: any[] = []; // Tableau bech nkhabiw fih routeurs ba3d filtre (Array for filtered search results)
  pagedRouters: any[] = []; // Tableau fih routeurs mta3 page heki kahaw (Array containing only routers for current page)
  loading = true; // Variable y9ollik rani nchargi (Boolean to track loading state)
  searchTerm = ''; // El mot mta3 recherche lli ktabha l'utilisateur (String variable bound to text search input)
  vendorFilter = ''; // El filtre mta3 l'marque (String variable bound to vendor select)
  
  // Pagination State
  pageSize = 25; // 9addech mn routeur nheb nchouf f'page (Number of items to show per page)
  currentPage = 0; // Num mta3 page e'li a7na feha (Index of the current page, 0-based)

  columns = ['name', 'loopback_ip', 'model', 'vendor']; // Les colonnes bech ybànou fl tableau (List of columns displayed in the mat-table)

  // <-- Router injected here
  constructor(private api: ApiService, private router: Router) {} // Injectinna l'API wel Routeur (Constructor injecting our API service and the Router)

  ngOnInit() { // Fonction tji m3a bedayet l'composant (Lifecycle hook runs when component initializes)
    this.api.getRouters().subscribe({ // Nkalmou backend bech ye3tina routers (Call the API to fetch routers data)
      next: (data) => { // Ken rja3li b'réponse sélim (Callback for a successful API response)
        this.routers = Array.isArray(data) ? data : (data.results || []); // Nhotou les données fl variable w na3mlou check 3ala e'site (Extract array of routers correctly from response)
        this.filteredRouters = this.routers; // Fel loul n7ottouhom l'koll bla filtre (Initialize the filtered list to be identical to full list)
        this.updatePagedRouters(); // N9assmouhom f'pagiets (Calculate the items for the first page)
        this.loading = false; // Nsakrou l'animation de chargement (Stop the loading spinner)
      },
      error: (err) => { // Ken fama moshkel (Callback for an API error)
        console.error(err); // Nhotto mochkel fil console (Log error details to the browser console)
        this.loading = false; // Neqfou 3la chargement khater error (Stop spinner even on error)
      }
    }); // Wfet l'appel API (End subscription)
  }

  get totalPages(): number { // Fonction ta7seb 9addech 3anna min page total (Getter calculating total amount of pages)
    return Math.ceil(this.filteredRouters.length / this.pageSize); // Ta9sem totale 3al page w ta3mel arrondi m'l fouk (Total divided by items per page, rounded up)
  }

  prevPage() { // Ken nhebbou narj3o l'page lteli (Function to go to the previous page)
    if (this.currentPage > 0) { // Ken ma7nech fel page loula (Ensure we are not already on the first page)
      this.currentPage--; // Nna9sou fel chiffre mta3 page (Decrement the current page index)
      this.updatePagedRouters(); // Nbedlou l'contenu ta3 l'tableau (Update displayed items)
    }
  }

  nextPage() { // Ken nhebbou nimchiw l'page l'9oddem (Function to go to the next page)
    if (this.currentPage < this.totalPages - 1) { // Ken mazzalna mawsalnach lelkher (Ensure we are not on the last page)
      this.currentPage++; // Nzidou nomro fel page (Increment the current page index)
      this.updatePagedRouters(); // Nbedlou array ili tet'afficha (Update displayed items)
    }
  }

  applyFilter() { // Fonction lli twalli active waqtli tekteb haja (Function triggered on search or filter change)
    let result = this.routers; // Nabdaou b'liste l'kbira (Start with the original full list of routers)
    if (this.searchTerm) { // Ken ktabt haja fel recherche (If a search term was typed)
      const term = this.searchTerm.toLowerCase(); // Nbadlou les lettres sghar bech na9raw s7i7 (Convert search term to lowercase for comparison)
      result = result.filter(r => // Nparcouriw e'tableau w nkharjou lli fihom l'mot (Filter the array using a callback)
        r.name.toLowerCase().includes(term) || // Nchoufou ken nom fih lmot (Check if router name includes the term)
        r.loopback_ip.toLowerCase().includes(term) // Wala IP fih lmot (Check if loopback IP includes the term)
      );
    }
    if (this.vendorFilter) { // Ken akhtart fournisseur/vendor (If a vendor is selected in the dropdown)
      result = result.filter(r => r.vendor === this.vendorFilter); // Khali kèn lli fihom l'vendor nafso (Keep routers matching the specific vendor)
    }
    this.filteredRouters = result; // Nhot l'resultat fel tableau mté3na (Update the filtered list with results)
    this.currentPage = 0; // Ki tzid test narj3ou lel page num 1 (Reset to the first page of results)
    this.updatePagedRouters(); // Nbedlou chnouwa lli yet'afficha (Update the slice for visualization)
  }

  updatePagedRouters() { // Fonction ta9sem l'liste 3la pagination (Function creating the current page's slice of data)
    const start = this.currentPage * this.pageSize; // L'index minin bech naqraw (Calculate the starting array index)
    this.pagedRouters = this.filteredRouters.slice(start, start + this.pageSize); // Na9saw w nekhthou chwaya min array (Extract the chunk of items to display)
  }

  // <-- Updated function: Navigates to the Summary Page
  selectRouter(router: any) { // Wa9tli nzouzzou 3la s'tar router (Triggered when user clicks a router row)
    this.router.navigate(['/routers', router.loopback_ip]); // Nhizzouh lel page ta3 tafasil hardware hetheka (Use the router to navigate to specific router details URL using its IP)
  }
} // Wfet class (End of component class)