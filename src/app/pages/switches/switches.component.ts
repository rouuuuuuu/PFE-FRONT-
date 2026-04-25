import { Component, OnInit } from '@angular/core'; // Njibou Component w OnInit men Angular (Core Angular imports for component setup)
import { CommonModule } from '@angular/common'; // njibou module el base kima ngIf w ngFor (Base module for directives)
import { MatTableModule } from '@angular/material/table'; // Module lel tableaux Material (Material tables)
import { MatCardModule } from '@angular/material/card'; // Module lel wrak/cartes Material (Material cards layout)
import { MatInputModule } from '@angular/material/input'; // Module d'entrée mta3 text (Material inputs)
import { MatFormFieldModule } from '@angular/material/form-field'; // Module lel les formulaires (Material form wrapper)
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Module lel chargement (Material spinner)
import { MatSelectModule } from '@angular/material/select'; // Module lel listes déroulantes (Material generic select dropdowns)
import { MatChipsModule } from '@angular/material/chips'; // Module lel chips/badges (Material chips)
import { FormsModule } from '@angular/forms'; // Module bech nesta3mlou ngModel (Forms model binding)
import { ApiService } from '../../services/api.service'; // L'API mte3na bech njibou données (Our injected API service)
import { Router, RouterModule } from '@angular/router'; // Router bech nnavegiw lel switch summary (Import Router for programmatic navigation)
import { MatIconModule } from '@angular/material/icon';

@Component({ // Ytarki l'class kima composant (Marks this class as an Angular component)
  selector: 'app-switches', // L'esem mta3 el balise HTML (HTML tag for this component)
  standalone: true, // Ma ye7tajech NgModule w ijjib koul chay wa7dou (A standalone component structure)
  imports: [ // Importation mta3 les bibliotheques mté3ou (Dependency injection list)
    CommonModule, // L'commun (Common functionalities)
    MatTableModule, // Tableaux (Tables)
    MatCardModule, // Elkwarit (Cards)
    MatInputModule, // El inputs (Input fields)
    MatFormFieldModule, // Les cadres ta3 forms (Form boundaries)
    MatProgressSpinnerModule, // El doureyya mta3 chargement (Spinners)
    MatSelectModule, // Listes déroulantes (Selects)
    MatChipsModule, // Chips zghar (Chips)
    FormsModule, // Forms
    MatIconModule,
  ],
  templateUrl: './switches.component.html', // Fichier l'HTML elli yest3amlou (HTML template path)
  styleUrl: './switches.component.css' // Fichier ej'Jamaleya w dZign (CSS template path)
})
export class SwitchesComponent implements OnInit { // Class lli bech tgerer es'switches (Main component class)
  switches: any[] = []; // El tàbla bech yet3aba bel les switches l'kol (Array holding all switches from API)
  filteredSwitches: any[] = []; // Tàbla lli metfiltréya lel wejh ychoufha (Array for filtered search results)
  pagedSwitches: any[] = []; // Tàbla bech ttafficha fl pagination (Array for current page view)
  loading = true; // Ywari e'spinner ta3 chargement fi blasse l'table (Boolean tracking page load state)

  // Search criteria
  nameSearch = ''; // El texte elli nlawjou fih e'nom (Input variable for name filtering)
  ipSearch = ''; // El texte elli nlawjou fih e'IP (Input variable for IP filtering)
  modelSearch = ''; // El texte mta3 modèle e'switch (Input variable for model filtering)
  routerSearch = ''; // El texte mta3 e'routeur el marbout (Input variable for connected router)

  pageSize = 25; // nhebbou nchoufou 25 fel page l'wa7da (Row count per page)
  currentPage = 0; // Nomro page el 7aliya (Index of the current view page)

  // Router id → name lookup map
  routerMap: Record<number, string> = {}; // Dictionnaire (Map bech nrabtou id el routeur chniya ismou) (Lookup table for matching router IDs to Names)

  // EXACT match to Django JSON keys
  columns = ['name', 'loopback_ip', 'interface_sw', 'connected_router', 'interface_rt', 'model']; // L'esemi mta3 l'a3mda ta3 el tablau (Data keys corresponding to the table columns)

  constructor(private api: ApiService, private router: Router) {} // Nejabou API Service w Router hnéna (Constructor injecting API service and Router)

  ngOnInit() { // Fonction elli tkhdem m3a awel affichage (Run tasks during component initial load)
    // Fetch routers first to build the id→name map, then fetch switches
    this.api.getRouters().subscribe({ // Tkalem serveur tjblek l'routeurs (HTTP GET call to get router list)
      next: (data: any) => { // Ken reponse mrigla w a7na hné (Success handler for router data)
        const routers: any[] = Array.isArray(data) ? data : (data.results || data.data || []); // Tchouf kifeh jay el response tableu walla objet (Normalization to an array of router items)
        routers.forEach(r => { this.routerMap[r.id] = r.name; }); // N3abiw el Map bech l'ID ya3tina El Name (Build associative array lookup dictionary)
      }
    }); // Wfet l'subscription (End router execution block)

    this.api.getSwitches().subscribe({ // Tkalem l'API t9olha a3tini es'switches l'kol (Initiate HTTP GET call to get the switches content)
      next: (data: any) => { // Ken labes etjaw w rja3 données (Success callback mapping switches response)
        this.switches = Array.isArray(data) ? data : (data.results || data.data || []); // Npostiwhom fel variable mté3na (Normalize to array and save to switches state)
        this.filteredSwitches = this.switches; // Felloul neffichiw l'kol bch njme3a nchoufhom (Init the filtered display array)
        this.updatePagedSwitches(); // N9et3ou mennou la tranche l'oulaniya lel pagination (Call function mapping current page contents)
        this.loading = false; // Neghl9ou es'spinner ta3 e'chargement (Switch off spinner loading)
      },
      error: (err) => { // Ken ja defaut ou masàr chay (Error handling function callback)
        console.error('Failed to fetch switches', err); // Ntba3ou el ghaltta fel log navigateur (Report errors to console details)
        this.loading = false; // Na7iw el loading ya sidi makèmlèch (Enforce removing loader interface despite error)
      }
    }); // Wfet getSwitches subscription (End HTTP observer response handler)
  } // Wfa el init (Ending of lifecycle hook block)

  getRouterName(id: number): string { // Fonction ta3tini esm e'routeur d'apres el ID te3ou (Helper map returning the proper router name referencing integer ID)
    return this.routerMap[id] || `#${id}`; // Traga3 el Name ya sinon etjawech id maktoub bi # (Return matching mapped string or default to hash format ID representation)
  } // Wfet (End function)

  get totalPages(): number { // Fonction calculer 9addech mn pages l'kolba (Calculator tracking pagination boundary integer limit)
    return Math.ceil(this.filteredSwitches.length / this.pageSize); // Trajem e'ttale lel pageSize bel round fo9ani. (Ceiling function parsing integer limit)
  } // Wfet (End calculation block logic)

  prevPage() { // Tarja3 letali fel page (Action advancing user context to older page display)
    if (this.currentPage > 0) { // Check ki manech fel l'ouwel pagina (Verify cursor isn't bound at index origin position)
      this.currentPage--; // Taya7 e'nomrou blè1 (Integer subtraction representing page shift)
      this.updatePagedSwitches(); // Ajouti les elements e'jdeid sur screen (Interface visualization sync map invocation)
    } // Wfa (Block)
  } // Wfet (Complete sequence logic action block)

  nextPage() { // Temchi ba33ad lelkoodem fel tableaute (Action pushing forward progression in user view space)
    if (this.currentPage < this.totalPages - 1) { // Check ken mazzel fina margin (Constraint boundary preventing buffer overflow visual access)
      this.currentPage++; // Ta3let ennoumrou ble1 (Value progression mathematical operator element)
      this.updatePagedSwitches(); // Traja3 w ta7adhir affichage visualeute d'tableau. (Invoking the refresh for paginated content map block)
    } // Wfet blocke (Completion block parameters conditions constraint)
  } // Wfet la action de l'event. (Completion bounds definitions object trigger element wrapper frame limits scope.)

  applyFilter() { // Funktion twaffi filtrage d'array w tzido l'el input (Aggregated logical function block to sort filtering list parameter options structure matching)
    let result = this.switches; // Nebda b'el arraya kemél l'oulaniya maktouba hné. (Start context locally initializing source items completely unmodified object reference array assignment node)

    if (this.nameSearch) { // Si e'champ Name Device mta3eb. (Validation check condition input element is not blank truthy evaluation node sequence handler object boolean resolution execution)
      const term = this.nameSearch.toLowerCase().trim(); // Nkhaliw kolchi lettres sghàr w nna7i espace fel goulba. (Transform lowercase parsing formatting helper parameter modifier element chain constructor format object reference element text)
      result = result.filter(s => s.name?.toLowerCase().includes(term)); // Tgarbel 7aseb esemha kan mwafek el ktiba na9sah wala bel kolliha taaraf taba3a hena format string. (Iterator filter comparison lambda logic expression element test condition object item value matching query string filter)
    }

    if (this.ipSearch) { // Ken ktébna haja fel l'IP search (Validates IP search existence parameter input form constraint)
      const term = this.ipSearch.toLowerCase().trim(); // E'text ndhafneh men foqha wlota w radinah seghir. (Parameter format normalization element modifier definition sequence handler text conversion chain evaluation item query assignment value reference format structure token definition wrapper format execution block text string)
      result = result.filter(s => s.loopback_ip?.toLowerCase().includes(term)); // Traja3 w ta7fas kén echay lli matabeq l'IP hekka. (Evaluation structure iteration lambda expression string item validation filter comparison execution item lookup constraint filtering reference assignment text context limit frame constraints string function test pattern parsing string format)
    }

    if (this.modelSearch) { // Si khtàr el modele de l'objet ou de l'equipe (Test input filter search logic bounds reference existence text constraint object)
      const term = this.modelSearch.toLowerCase().trim(); // Tsagherou ta text bech myaghlatich l'utilisateur de l'application wala e'interface (Standard input sanitation pipeline assignment execution format modifier value assignment assignment sequence)
      result = result.filter(s => s.model?.toLowerCase().includes(term)); // T9ayém w tshof ki fihum model wala. (Data extraction iterator comparison predicate logic matching rule value reference assignment bounds formatting)
    }

    if (this.routerSearch) { // Ken el routerSearch parametre tekteb lbarra wala e'dakhél (Validating routing search parameter element reference context item assignment format sequence element initialization form logic block structure condition value bounds resolution evaluation logic block)
      const term = this.routerSearch.toLowerCase().trim(); // Kif khouthou tsagghar el textes wa tsawbouhoua na9yin wala. (Variable object instantiation test reference data mutation format parsing lambda block sequence pipeline text configuration limits frame modifier parameter definition)
      // Search by router name using the lookup map
      result = result.filter(s => { // Fonction filter s7i7a t'testi id's mta3 arraya (Array mapping lambda filtering block definition sequence execution block logical condition loop boundary wrapper form reference iteration limit parsing lambda testing logic block sequence definition logic structure constraints framework iteration bounds matching sequence)
        const routerName = this.routerMap[s.connected_router] || ''; // Njibou essoum b'l id w m3aba hne (Resolution evaluation map query getter indexing lookup reference pattern assignment array limits matching sequence iteration boundaries test lambda bounds parameter frame logic framework boundaries constraints execution evaluation framework bounds execution text wrapper definition)
        return routerName.toLowerCase().includes(term); // Truu wala falssa kan lqitouhou hne fel lookup. (Condition logic truth matching text assignment evaluation bounds validation condition node check execution structure token reference expression resolution boolean parameter definition execution logic return limit evaluation statement framework block format frame iteration parsing node rules validation filter return sequence format pattern frame reference definition parsing truth lambda test parameters filter bounds token definition logic)
      });
    }

    this.filteredSwitches = result; // Nsayfou liste mgarblè w msaqètt l'arrayte jdida hekka hne f hal block framework limit parameter definition reference parsing token execution execution statement assignment formatting execution form structure token structure constraint reference frame matching sequence token test definition matching execution boundaries block rule rule reference. (Setting resulting filter list bounds assignment mapping context reference pointer element test filter object update block reference variable definitions value limits bounds constraints matching frame text context parameter pattern bounds constraints iteration loop frame rule condition parameter filter definition evaluation context definition framework matching parsing node wrapper iteration framework token variables boundaries wrapper framework structure condition resolution lambda loop frame pattern parameter limits sequence.
    this.currentPage = 0; // Tratti w tasfer el pagination bch ywari lewelaniya mta3 liste resultate jdaéd hné (Zero bound mapping logic sequence condition format logic token condition constraint element pointer definitions parameter resolution format. Reset pagination counter.)
    this.updatePagedSwitches(); // 3awid jid e'display ywari liste loulé w msagmé format hné kma tjawna bel louné ta application (Update mapped interface context execution trigger lambda parsing frame parameter wrapper conditions resolution execution statement iteration constraints block pattern element condition constraints execution definition wrapper constraints token logic framework reference boundaries limits parsing object pattern limits sequences logic matching rule testing limit text execution sequence rules lambda limits framework.)
  }

  updatePagedSwitches() { // Function ta9sem e'arrayet mta3 tabla w ykamel 3lihe fil pagination logic limit bounds loop (Logic rendering boundary subset items constraint parameter reference text framework element assignment resolution framework bounds rule parser parameters test token parameter structure rule structure execution form string limits constraints mapping execution boundaries function definitions string limits format constraint logic constraints limits constraints definition logic execution rule logic definitions syntax element.)
    const start = this.currentPage * this.pageSize; // Calculate l'offset bech nwariw l'switches mté3nèh f ha'logic block iteration constraints bounds loop variable format test logic format sequence logic logic condition execution variables parameters framework assignment block reference mapping format. (Array offset indexing definition evaluation math logic sequence text syntax token parser format.)
    this.pagedSwitches = this.filteredSwitches.slice(start, start + this.pageSize); // Qoss e'tabbleu b slice bech ta3tena chouwaya akra 7aseb pagina limite bounds loop execution format definitions execution block lambda limits structure mapping bounds parser logic limits variables value assignment structure object evaluation text wrapper rules parameters syntax configuration assignment limits syntax definition limits object mapping parameter pattern configuration sequence evaluation object parsing execution variables constraints variables lambda test syntax condition parser boundaries logic mapping iteration framework. (Slice filtered content array map mapping parsing rule resolution wrapper structure assignment format parser framework logic block definitions logic configuration structure string rules reference object limits test rules.
  }

  /** Navigates to the switch summary page when a row is clicked */
  selectSwitch(sw: any) { // Wa9tli nzouzzou 3la s'tar switch (Triggered when user clicks a switch row)
    this.router.navigate(['/switches', sw.loopback_ip]); // Nhizzouh lel page ta3 ports hetheka (Navigate to switch summary using its loopback IP)
  }
} // Wfa el class el complet