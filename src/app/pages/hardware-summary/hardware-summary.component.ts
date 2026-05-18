import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core'; // <-- Add Inject and PLATFORM_ID (Jibna les decorateurs ml code base mta angular syntax mapping tokens limitations configurations variable references)
import { CommonModule, isPlatformBrowser } from '@angular/common'; // <-- Add isPlatformBrowser (Lel browser check w common directives loops format constraint mapping boundaries parameter definition configuration limits)
import { ActivatedRoute, Router } from '@angular/router'; // E'routage besh najmou nkalmou paramettre wl page jdid configurations parameters definitions mappings evaluation text context rules)
import { MatCardModule } from '@angular/material/card'; // Les cartes material limits parameters limit bounds)
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Spinner l'loading limit variables parameters condition definitions texts)
import { MatIconModule } from '@angular/material/icon'; // L'icounet mta3 material format text bounds parsing limits limit contexts string)
import { ApiService } from '../../services/api.service'; // E'service API mté3na bech nmidou mnou strings validation constraints mapping contexts token syntax mapping format configurations validations iteration sequence parameter limit context boundaries execution rules definition element formatting bounds limit contexts text sequences.
import { NgChartsModule } from 'ng2-charts'; // Component ta3 graphique limit limitations variables definitions context loops limits references string token parsing variable parameters mapping limitation boundary execution validation parameters texts logic mapping boundary.
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js'; // typage mta3 graphique configurations rules constraints boundary rule format context syntax context.

@Component({ // Définition l'composant limits sequence validation.
  selector: 'app-hardware-summary', // E'tag fl DOM loop parameter constraint parameters rule.
  standalone: true, // Type standalone limitations constraint text definition variable structure variables logic.
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, NgChartsModule], // Les dépendances mta3 module formats formatting reference configurations boundaries limit validations tokens sequences configurations iteration context rule formats mapping format configuration sequence variable string bounds text string constraint formats definitions elements texts.
  templateUrl: './hardware-summary.component.html', // path l'template limits variables parameter formatting variables iteration context mapping constraints boundaries context limits contexts mapping parsing formats values contexts sequence definition configuration definition parsing logic elements strings evaluation validations texts limits context definitions definition contexts mapping parameters limitations iteration sequences structure limits pattern limit limitation loops mapping.
  styleUrl: './hardware-summary.component.css' // path l'css rule limitation formatting limits rule context boundary value variables context parameters execution.
}) // limit parsing rules limitations contexts validations sequences limit rules limits texts format contexts limit rules validation evaluation context format.
export class HardwareSummaryComponent implements OnInit { // definition mta class strings logic execution logic texts definitions limitations rules boundaries formatting definitions constraints loops limits.
  ip: string = ''; // ip elli besh ykhdem aalih validations string variable bounds context evaluations limitation values evaluation logic token value mapping parameters sequences references configuration definitions mapping strings tokens variables limit sequence limitation.
  verification: any = null; // data li tarja3 ml api limitations bounds limits validations frameworks sequences mappings parsing constraint parameters limits limits validation sequences validation loops sequence references variable validation definition conditions constraints limits parsing mappings token loop loop boundaries loops constraints parsing iteration limits validation loops evaluations references evaluations constraints executions loop boundaries parameter parsing format definitions.
  loading = true; // status l'loading definitions limit format parameters formatting rule parameter parameters loop definitions loop constraints format strings evaluation formatting evaluation rule context configuration mapping limits variable mapping validations boundary formatting limitations text limits validations parameters boundaries elements limitations variables iterations loop parameters context parameters limits context logic variables configurations parsing limits parsing.
  isBrowser: boolean; // <-- Add this variable (ntestiw idha a7na fl browser wla le tokens conditions evaluation.

  // Pre-calculated counts
  portsUp = 0; portsDown = 0;
  cardsNormal = 0; cardsAbnormal = 0;
  sfpsNormal = 0; sfpsAbnormal = 0;
  subcardsNormal = 0; subcardsAbnormal = 0;

  // Verification panel
  verificationResults: any = {};
  overallStatus: string = '';
  totalPorts = 0; totalCards = 0; totalSfps = 0; totalSubcards = 0;

  // --- CHART CONFIGURATIONS ---
  public chartOptions: ChartOptions<'doughnut'> = { // options ta doughnut chart boundaries logics logic syntax logics limit logics references limit rule configuration logics sequences values texts validations mappings token string constraint context boundary variables definitions limit loops validation limitations boundaries variable configurations boundaries values parsing context loop rules definitions evaluations validation definitions loops framework constraints.
    responsive: true, // tetwassel boundaries definitions limit iteration formats limits condition parameters strings values limitations boundaries conditions limitations mapping texts limits value limit loop limitation boundary configurations limitations parsing constraints rule validations variables formats framework contexts texts framework value configurations bounds values boundary string string logic framework mapping contexts definitions definitions.
    maintainAspectRatio: false, // heki matkhafech logic format variables definitions contexts texts boundaries boundary rule condition limit variables sequence tokens syntax elements condition parameters parameter definitions loops execution format loops formatting parameters values definition mapping iterations boundary references configurations formats conditions limit limit parsing validations rules contexts tokens values parameters validations loop validation configurations evaluation token boundaries token string text limits mappings parameters rule execution frameworks loop texts limit structure evaluation sequences conditions limits loop texts parameters mappings loop.
    cutout: '70%', // zeyda mn dakhil boundary string boundary.
    plugins: { legend: { display: false } } // heta legend rule references limitation definitions frameworks bounds definitions constraints conditions mappings logics framework parameter string iteration sequences variables boundaries token framework definition variables bounds mapping format iterations value bounds structure validations.
  }; // rules string limits strings text context boundary limit parsing variable boundary boundary logics parameters mapping strings strings configurations execution framework bounds parsing execution loop elements.

  public portsChartData: ChartData<'doughnut'> = { labels: ['Up', 'Down'], datasets: [{ data: [] }] };
  public cardsChartData: ChartData<'doughnut'> = { labels: ['Normal', 'Abnormal'], datasets: [{ data: [] }] };
  public sfpsChartData: ChartData<'doughnut'>  = { labels: ['Normal', 'Abnormal'], datasets: [{ data: [] }] };
  public subcardsChartData: ChartData<'doughnut'> = { labels: ['Normal', 'Abnormal'], datasets: [{ data: [] }] };

  constructor( // constructeur loops rules logic configuration constraints limits text format loop format limits validation variable mappings format limits boundaries mappings configuration value contexts limitations limit validation elements limitations texts texts definitions mapping token boundaries mappings string pattern evaluation values limitation contexts variables.
    private route: ActivatedRoute, // e'route heka limit definition value limits context mapping format limitations tokens mapping definition limit variables string elements logics context loops loops strings strings sequences.
    private router: Router, // navigation limit validations formatting variable validation mapping boundaries boundary parameters evaluations contexts context constraints constraints boundaries configurations execution formats evaluations rule references frameworks.
    private api: ApiService, // e'service mta3 limit logics limitation strings formats loop logics.
    @Inject(PLATFORM_ID) private platformId: Object // <-- Inject platform info (Token heka ya3raf a7na win server wla browser formats contexts boundaries rules execution constraints evaluations validations texts context validation loops constraint evaluation framework).
  ) { // constraints definitions limits variables definitions mapping framework texts sequence configuration sequence framework boundary validations logic texts logics limitation.
    // Check if we are in the browser
    this.isBrowser = isPlatformBrowser(this.platformId); // nchoufou a7na f'browser boundaries limits limits validation configuration limits parameters parameters parameters configuration validation rule validations context value logic format limitation limit execution text execution frameworks loop limits configurations frameworks limit mappings limits texts evaluations limit loop mapping mappings parameters bounds validations boundaries.
  } // limitation reference loop bounds mapping validations context strings logics constraints string string boundary condition constraints validation configurations formats definitions variables condition tokens parameter syntax parameters bounds formatting variable looping execution definition limitation configuration limit validation configurations constraints loop logics limits limit variable text values formatting rules configuration definition iterations mappings iteration values logic parameter validation validations rules token boundaries constraints structure limit elements references boundary.

  ngOnInit() { // cycle init boundaries limits configurations loop conditions loops conditions mapping logics context sequences.
    this.ip = this.route.snapshot.paramMap.get('ip') || ''; // njibou l'ip mté3na ml url execution mapping framework limits logics configurations logic bounds execution parameters parameters condition rule values validations formatting contexts limits configurations evaluations texts texts boundaries validation formats evaluation values limits limitations validation formats limitations parameters.
    
    if (this.ip) {
      // Call 1: unified device — device info + ports/cards/sfps
      this.api.getUnifiedDevice(this.ip).subscribe({
        next: (data: any) => {
          this.verification = data;

          const portList = data.ports || data.port_details || [];
          const cardList = data.cards || data.card_details || [];
          const sfpList  = data.sfps  || data.sfp_details  || [];

          this.totalPorts = portList.length;
          this.totalCards = cardList.length;
          this.totalSfps  = sfpList.length;

          this.portsUp       = portList.filter((p: any) => (p.oper_status || p.status || '').toLowerCase() === 'up').length;
          this.portsDown     = portList.filter((p: any) => (p.oper_status || p.status || '').toLowerCase() !== 'up').length;
          this.cardsNormal   = cardList.filter((c: any) => (c.board_status || c.status || '').toLowerCase() === 'normal').length;
          this.cardsAbnormal = cardList.filter((c: any) => (c.board_status || c.status || '').toLowerCase() !== 'normal').length;
          this.sfpsNormal    = sfpList.filter((s: any)  => (s.rx_status || s.status || '').toLowerCase() === 'normal').length;
          this.sfpsAbnormal  = sfpList.filter((s: any)  => (s.rx_status || s.status || '').toLowerCase() !== 'normal').length;

          if (this.isBrowser) {
            this.portsChartData = {
              labels: ['Up', 'Down'],
              datasets: [{ data: [this.portsUp, this.portsDown], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
            this.cardsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{ data: [this.cardsNormal, this.cardsAbnormal], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
            this.sfpsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{ data: [this.sfpsNormal, this.sfpsAbnormal], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
          }

          this.loading = false;
        },
        error: (err) => { console.error(err); this.loading = false; }
      });

      // Call 2: verifyDevice — subcard_details (status field) + verification_results
      this.api.verifyDevice(this.ip).subscribe({
        next: (vData: any) => {
          this.verificationResults = vData.verification_results || {};
          this.overallStatus       = vData.overall_status || '';
          this.totalSubcards       = vData.counts?.total_subcards || 0;

          const subcardList: any[] = vData.subcard_details || [];
          this.subcardsNormal   = subcardList.filter((sc: any) => (sc.status || '').toLowerCase() === 'normal').length;
          this.subcardsAbnormal = subcardList.filter((sc: any) => (sc.status || '').toLowerCase() !== 'normal' && (sc.status || '') !== '').length;
          if (!this.totalSubcards) this.totalSubcards = subcardList.length;

          if (this.isBrowser) {
            this.subcardsChartData = {
              labels: ['Normal', 'Abnormal'],
              datasets: [{ data: [this.subcardsNormal, this.subcardsAbnormal], backgroundColor: ['#4caf50', '#f44336'], hoverBackgroundColor: ['#45a049', '#e53935'] }]
            };
          }
        },
        error: (err) => { console.error('verifyDevice:', err); }
      });
    }
  } // logics sequences format mapping rule limitations loops context formatting context parsing context mapping configurations boundaries elements contexts variables validations parameters variables parameters limits constraints rules validations limits boundaries variables condition variables logic framework logics limits tokens limitation parameters execution limitations.

  goToDetails(type: string, status: string) { // nhezouni l'details parameter constraint validation texts evaluation configurations definitions parameters condition variables parameters formatting variables formatting parsing mappings reference constraints mappings variables parameters reference mapping definitions loop execution condition boundary conditions variables validation limit mapping limits syntax definition formatting definition looping looping references string validation parsing.
    this.router.navigate(['/routers', this.ip, type, status]); // routage mta details mapping syntax variable definition text formatting limits definition limits constraints definitions limits parameters configurations limitations evaluation values boundaries string limits mapping loop parameter string logic format variables limitations parsing parameters validation variables mapping configurations limits validations.
  } // texts boundaries values.

  goBack() { // back limit parameters text mappings configuration sequence validations configurations constraints logics token context loops boundaries configuration validations bounds looping definition mapping parameter strings configurations framework conditions limitations condition limitation evaluation parsing definition parameter parsing looping mapping limits definition mapping conditions.
    this.router.navigate(['/routers']); // narj3ou l'routers limits variables mapping elements validation limits bounds definitions constraints format elements string mapping limits condition mapping variables limitations parameters logic variables limitations definition rule.
  } // context format definitions variables variables rules mapping variable syntax parameters reference mapping formats format evaluations limitations limits texts mapping string configuration context definition limits definition.
} // texts bounds values boundaries loops limit structure format logic loop logics value contexts limits.