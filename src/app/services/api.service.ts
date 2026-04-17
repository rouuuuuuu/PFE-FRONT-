import { Injectable } from '@angular/core'; // Décorateur Injectable men Angular (Marks class as an injectable service)
import { HttpClient, HttpParams } from '@angular/common/http'; // HttpClient w HttpParams bech nb3thou les requêtes web (Classes for making HTTP requests and handling query params)
import { Observable } from 'rxjs'; // Observable men RxJS bech ngériw les données asynchrones (Handles asynchronous data streams)

const API_URL = 'http://127.0.0.1:8000/api'; // L'adresse mta3 l'backend Django (The base URL for our backend API)

@Injectable({ // Y9oul l'Angular elli service hedha ynejjem tet'injecta f'blasa okhra (Allows this service to be injected into components)
  providedIn: 'root' // Mdisponible fil application l'koll (Service is provided at the root level, making it a singleton)
})
export class ApiService { // Définition mta3 l'class ApiService (Export the API service class)
  constructor(private http: HttpClient) { } // Constructeur bech nsobbou l'HttpClient dakhil l'class (Inject HttpClient via constructor)

  // ==========================================
  // DASHBOARD (Tableau de bord)
  // ==========================================
  getDashboardStats(): Observable<any> { // Fonction bech njibou les statistiques (Gets general stats for the dashboard)
    return this.http.get(`${API_URL}/dashboard/stats/`); // Taba3th GET request lel lien mta3 les stats (Sends GET request to stats endpoint)
  }

  // ==========================================
  // INVENTORY (ROUTERS & SWITCHES) (Inventaire mta3 réseau)
  // ==========================================
  getRouters(page?: number, search?: string): Observable<any> { // Fonction njibou biha liste des routeurs (Fetches the list of routers, supports pagination and search)
    let params = new HttpParams().set('limit', '500'); // N7adrou les paramètres fel GET w n7ottou limite 500 (Set custom query params, defaulting limit to 500)

    if (page !== undefined) { // Ken 3attina page (If a specific page is requested)
      params = params.set('page', page.toString()); // Nzidou paramètre mta3 num page (Append page number to query params)
    }
    if (search) { // Ken fama mot de recherche (If a search term is provided)
      params = params.set('search', search); // Nzidou recherche lel params (Append search query toparams)
    }

    return this.http.get(`${API_URL}/routers/`, { params }); // Neb3thou l'requête m3a les paramètres (Execute GET request with all built params)
  }

  getSwitches(page?: number, search?: string): Observable<any> { // Fonction bech njibou e'switches (Fetches the list of switches)
    let params = new HttpParams().set('limit', '500'); // Kif kif l'limite b'500 (Initialize params with a limit of 500)

    if (page !== undefined) { // Ken e'num page mawjoud (Check if page parameter exists)
      params = params.set('page', page.toString()); // Nzidouh lel requete (Add it to URL parameters)
    }
    if (search) { // Ken fama mot bech nlawjou 3lih (Check if search parameter exists)
      params = params.set('search', search); // Nzidou l'mot fel requete (Add search string to URL parameters)
    }

    return this.http.get(`${API_URL}/switches/`, { params }); // Executi l'requête GET lel switches (Send the HTTP request for switches)
  }

  // ==========================================
  // BACKHAUL LINKS (Liaisons réseau)
  // ==========================================
  getBackhaulLinks(page: number = 1, search: string = '', alarm: string = ''): Observable<any> { // Njibou les liens backhaul w na7diwhom b'pagination/search/alarm (Fetch links with default filters)
    let params = new HttpParams().set('page', page.toString()); // Paramètre l'page yemchi par défaut (Start building params with page number)

    if (search) { // Ken fama terme mta3 recherche (If a text search is provided)
      params = params.set('search', search); // Nsobbouh fil param (Set the search param)
    }
    if (alarm) { // Ken nhebbou nfiltrsiw bil alarme (If filtering by alarm severity)
      params = params.set('alarm_severity', alarm); // Nzidou l'alarme lel requete (Set alarm severity param)
    }

    return this.http.get(`${API_URL}/backhaul/links/`, { params }); // Taba3th e'requete finale (Execute GET request for links)
  }

  // ==========================================
  // HARDWARE VERIFICATION (Vérification l'matériel)
  // ==========================================
  verifyDevice(ip: string): Observable<any> { // N3aytou l'fonction bech ntastiw l'matériel via son IP (Run hardware verification checks)
    return this.http.get(`${API_URL}/hardware/verify/${ip}/`); // Requête m3a e'IP fel lien directement (Send GET mapping IP into the URL)
  }

  // ==========================================
  // PROVISIONING & AUTOMATION (Automatisation w tachets)
  // ==========================================
  startProvisioning(data: any): Observable<any> { // Fonction bech nlanciou Tache (Start an automated task sequence)
    return this.http.post(`${API_URL}/provisioning/start/`, data); // Rahi POST request mouch GET 5ater bech nbadlou les données (Use POST since we are creating/initiating a task)
  }

  getProvisioningTasks(): Observable<any> { // Njibou l'historique mta3 e'taches l'koll (Fetch general list of all provisioning tasks history)
    return this.http.get(`${API_URL}/provisioning/tasks/`); // GET lel liste mta3 les tâches (Execute GET for task history)
  }

  getProvisioningStatus(taskId: number): Observable<any> { // Nthabbtou state mta3 tache specific (Check the status of a specific task via ID)
    return this.http.get(`${API_URL}/provisioning/status/${taskId}/`); // GET w njibou l'état actuel (Execute GET mapping the task ID into the URL)
  }
} // Wfa e'service (End of service class)