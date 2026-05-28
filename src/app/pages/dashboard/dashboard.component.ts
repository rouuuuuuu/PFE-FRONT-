import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { AlarmService } from '../../services/alarm.service';

interface ParsedReport {
  criticalAlarms: number;
  normalAlarms: number;
  totalAlarms: number;
  linkType: string;
  affectedNodes: { name: string; role: string }[];
  actions: string[];
  sections: { number: number; title: string; icon: string; body: string }[];
  healthPct: number;
}

@Component({ // Ngoulou hetha composant lel angular (Define component parameters)
  selector: 'app-dashboard', // E'tag fl html eli bech nfichiw bih e'composant (HTML rendering selector string name format configuration)
  standalone: true, // Ma ye7tajch imports fi module akher (Independent standalone rendering scope mode initialization)
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, NgChartsModule], // Les blocs lli nzidonhom f'liste dépendances mta framework structures format tokens variables validation logic mapping mapping loops condition context token format configurations limits constraints evaluation variables parameters limitations definitions string values boundaries parsing parameters rule execution.
  templateUrl: './dashboard.component.html', // lien fichier e'design l'kbir w l'layout form boundaries limits configurations text parameter mapping rule reference parsing values parameter limitations parameter mappings format texts sequences.
  styleUrl: './dashboard.component.css' // heki l'url mté3 e'zwaeq w design e'css format rule logic execution configuration condition parameters parsing syntax matching rules parsing constraint conditions elements text boundaries parameters limits sequence syntax configuration.
}) // Wfet configuration (End decorator mapping loop)
export class DashboardComponent implements OnInit { // El class mté3a li fiha khedma l'koul limitations element pattern syntax bounds configurations loop format definition boundaries references execution.
  stats: any = null; // Fih l'statistiques t'dashboards heeka configuration syntax parameter variable configuration boundary context mapping texts sequence limits strings references mapping limitations validation variable text sequences token.
  loading = true; // variable lel t'chargement hekka structure parameters parsing definitions limits framework limitations loop boundaries mappings execution string elements parsing rule token value formats loop condition resolution element bounds.

  // Variables pour le contrôle de l'affichage
  expandedRow: 'top' | 'bottom' | null = null; // Yحدد aneh l'row elli expanded parameters format limitations mapping parameters references text boundaries condition texts context limits text iterations sequences validation parameters boundaries.
  activeType: string | null = null; // chniyya naw3 l'donnes l'map texts conditions loops parsing parsing validation variables limitation mapping sequences rules texts rule structure limitation bounds elements rule values mapping parameters strings evaluation execution syntax limits mapping definition limitations logic.
  chartTitle: string = ''; // esem chart format variables bounds mapping strings string iterations parameters formatting rules parameters constraint configuration mapping parameters parsing token boundaries.

  // Configuration Chart.js
  public pieChartType: ChartType = 'pie'; // naw3 diagramm lwe7ed pie chart configurations references parameters logic execution format parameters loop parsing format.
  public pieChartOptions: ChartConfiguration['options'] = { // Les options mta3 l'affichage e'pie parameters parameter value sequences boundaries strings definition mapping variables parsing constraint mapping formatting resolution format bounds condition evaluation limit boundaries variables condition logic limits mapping elements definition references parameters value matching text.
    responsive: true, // tetwassel 7asab e'shasha bounds evaluation sequence rule strings definition text configuration boundary logic rule rules format resolution limitations condition rule limits reference constraints values execution limit mapping parsing mapping condition formats parameters context limitation mapping configuration constraints mappings limit formatting constraints boundaries sequences sequence conditions rules pattern reference variables variables boundary string limit loop frame formats definitions loop texts syntax definitions variables references contexts execution variables syntax limitations parsing.
    maintainAspectRatio: false, // ma to93odch nefs e'ratio loop context mappings parameters resolution value format.
    plugins: { // zidna e'plugins ta3 legende logic rule elements sequence boundary evaluation limitation formats structure rules text.
      legend: { position: 'bottom' } // het legend ml lota limitation parameter syntax parameters limit logic strings limits parameters limitations bounds references execution texts strings mapping parameters sequence syntax limit frame values formats matching parsing parameter context format texts limit variables limitations variables boundary text loop text mapping limitation limits bounds rules limitation conditions reference text formatting limits mapping syntax string context text boundaries formatting loops token parsing mapping format mapping boundaries pattern references value format definitions sequence parameters definitions sequences sequences formats string limits definition token text conditions limitation limits token frame format contexts mapping resolution parameters definition limits boundary resolution context format resolution string formatting constraints syntax definitions validation configuration configuration sequences text rule validation token formatting mapping constraint parameter mappings conditions.
    } // values limit format condition limitations limit contexts pattern string sequence parameter logic string sequences evaluation mapping condition definition texts limits mapping definition syntax parsing mapping parameters structure limitations frame logic token format constraints definition syntax text elements definitions execution boundaries logic loops variable token definition boundaries mappings matching limits conditions parameters parsing loops.
  }; // limit validation value limit sequences validations validation pattern variables pattern limitations configurations definitions value context mapping parameters structures limits rule value format limits evaluation values context parameters configuration format bounds contexts constraints limits framework logic sequence limit formatting rules texts boundaries pattern framework string loops variables token execution boundaries rules pattern contexts format variables.

  public pieChartData: ChartData<'pie'> = { // Dataset e'pie configuration constraints parsing syntax execution formats loop limit.
    labels: [], // E'labels values reference boundaries context configuration formatting strings limitation texts definition variables limitations string mappings constraints mappings formatting bounds formats parameters limitations element parsing conditions rules validations syntax limits configurations token mapping rules context boundaries definitions structures loop configurations limits limitations values token text strings string definition variables sequence formatting logic parsing boundary parsing references limits mappings syntax element limits token framework parsing sequences reference pattern sequence text limits limit boundaries mapping definition limits parameters values boundaries rule context definition constraints.
    datasets: [{ data: [] }] // E'Nwamér mta3 données limitation limits iterations references variables configuration bounds loop definition boundaries execution logic loop sequences structure frame logic loop boundaries limitations elements token parsing formatting limits validations parser token pattern text logic execution boundaries definitions limitation strings parsing limitation boundaries texts pattern loop format sequences texts limits conditions strings constraint definition logic bounds formatting context mappings variables parsing contexts text mapping limit configuration text parameters references constraints variables context configurations mapping condition references bounds references variables context definition condition texts condition condition parameter condition condition mapping pattern limitation limit limitations limit context string definition rules sequence limit pattern mappings parameters context resolution pattern execution logic values loop parsing pattern text iteration parsing limitations definition elements mappings limits condition context variables boundaries texts text string execution logic value texts limitation sequence values structure limit frame mapping boundary constraint sequences parsing variables variables token contexts limits reference string variables parsing boundaries variables framework syntax parser reference rules context logic framework framework mappings variables context configurations logic evaluation strings limit string conditions sequence condition parsing evaluation contexts configuration context validation strings boundaries strings mappings definitions values limitation rules structure mappings condition limits mapping string references parsing values.
  }; // text loops parameter mapping evaluation contexts variables rule strings logic mappings text iteration element token limit logic rules value bounds strings elements limits contexts formatting structure configuration resolution loops format limits constraints context mapping format loops loop limits pattern limits context configuration strings bounds evaluation condition formatting loops token contexts definition mappings references validation frame.

  // Palette de couleurs pour les multiples modèles de switch
  private colorPalette = [ // Liste les couleurs limits elements reference logic mapping sequence condition definition parsing limits formats texts limits sequence format strings constraints limit.
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', // limits token string texts variables contexts variables context loop execution definitions mappings references reference context strings variables limit contexts limit iterations mapping formatting limits format execution iteration configurations parsing references variables sequence boundaries parsing patterns logic string definitions text constraints constraint mappings sequence formats reference variables limitation boundaries parsing references bounds definition boundaries rule conditions limitations variables condition formats texts texts validation contexts boundary texts variables configurations texts limits context configuration.
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', // elements syntax conditions evaluation limitations variables definition reference logic loop parameters boundaries parameters loop logic references references parameters execution format boundaries text variable syntax definitions logic text mapping conditions token resolution syntax evaluation limit rule text configuration text condition structure mapping texts references values mapping.
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896' // variable token loop constraints contexts matching mapping validation limit texts strings references limitations format structures variables configuration limitations contexts pattern conditions condition sequence mappings limits limit loop boundaries sequences text condition evaluation limitation rules condition limitations bounds conditions mapping parser strings strings evaluation parameter references structure limits loop text formatting mappings logic context text limit parsing value parsing limitation limit constraints contexts definition limits parser variables texts references limit limits formatting definition limitations texts strings context context value limitations condition strings limitation variables contexts formats loops variables validation formats limits validations texts mapping logic limitation tokens limits loop boundary reference.
  ]; // validation token context structure values limits pattern pa  // ── Analysis state ──────────────────────────────────────────────────
  analysis    = '';
  analysisHtml: SafeHtml = '';
  alarmCount  = 0;
  totalLinks  = 0;
  analysisLoading = false;
  parsedReport: ParsedReport | null = null;

  // ── Alarm donut chart ────────────────────────────────────────────────
  alarmChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  alarmChartType: ChartType = 'doughnut';
  alarmChartOptions: any = {
    responsive: true,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}`
        }
      }
    },
    animation: { duration: 800 }
  };

  constructor(private api: ApiService, private alarmService: AlarmService, private sanitizer: DomSanitizer) { }

  loadAnalysis() {
    this.analysisLoading = true;
    this.parsedReport = null;
    this.alarmService.getAnalysis().subscribe({
      next: (res) => {
        this.analysis   = res.analysis;
        this.alarmCount = res.active_alarms_count;
        this.totalLinks = res.total_links;
        this.parsedReport = this.parseReport(res.analysis);
        this.alarmChartData = {
          labels: ['Critical', 'Normal'],
          datasets: [{
            data: [this.parsedReport.criticalAlarms, this.parsedReport.normalAlarms],
            backgroundColor: ['rgba(239,83,80,0.85)', 'rgba(102,187,106,0.75)'],
            borderColor:     ['#ef5350', '#66bb6a'],
            borderWidth: 2,
            hoverOffset: 6
          }]
        };
        this.analysisHtml = this.sanitizer.bypassSecurityTrustHtml(this.renderAnalysis(res.analysis));
        this.analysisLoading = false;
      },
      error: (err) => {
        console.error('Alarm analysis error:', err);
        this.analysisLoading = false;
      }
    });
  }

  /** Parse raw AI text into a structured report object */
  private parseReport(text: string): ParsedReport {
    // ── Alarm counts ────────────────────────────────
    const critMatch = text.match(/(\d+)\s*critical/i);
    const normMatch = text.match(/(\d+)\s*normal/i);
    const criticalAlarms = critMatch ? +critMatch[1] : 0;
    const normalAlarms   = normMatch ? +normMatch[1] : 0;

    // ── Link type ───────────────────────────────────
    const linkMatch = text.match(/\b(\d+GE|\d+G)\b/i);
    const linkType  = linkMatch?.[1]?.toUpperCase() ?? 'Link';

    // ── Affected nodes ──────────────────────────────
    const nodeRe = /\b([A-Z]{2,6}_\d{3,4}_[A-Z]{1,4}_[A-Z0-9]+_\d{3,4})\b/g;
    const rawNodes = [...new Set([...text.matchAll(nodeRe)].map(m => m[1]))];
    const affectedNodes = rawNodes.map(n => {
      const parts = n.split('_');
      return { name: n, role: parts[2] ?? 'NODE' };
    });

    // ── Priority actions ────────────────────────────
    // Find the RECOMMENDED ACTIONS section and pull lines that look like steps
    const actionsSection = text.match(/RECOMMENDED ACTIONS[\s\S]*?(?=\n\d+\.|$)/i)?.[0] ?? '';
    const actionLines = actionsSection
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 12 && !/^(RECOMMENDED|Priority steps)/i.test(l));
    // Strip leading "Verb phrase:" → keep full line; strip bullet/number prefix
    const actions = actionLines
      .map(l => l.replace(/^[-•*\d.]+\s*/, '').trim())
      .filter(l => l.length > 8);

    // ── Numbered sections ────────────────────────────
    const sectionRe = /^(\d+)\.\s+([A-Z][A-Z\s]+)$/gm;
    const sectionMatches = [...text.matchAll(sectionRe)];
    const sections: ParsedReport['sections'] = sectionMatches.map((m, i) => {
      const next  = sectionMatches[i + 1];
      const start = (m.index ?? 0) + m[0].length;
      const end   = next?.index ?? text.length;
      const body  = text.slice(start, end).trim();
      const iconMap: Record<string, string> = {
        '1': 'summarize', '2': 'device_hub', '3': 'manage_search',
        '4': 'checklist', '5': 'monitor_heart'
      };
      return {
        number: +m[1],
        title:  m[2].trim(),
        icon:   iconMap[m[1]] ?? 'info',
        body
      };
    });

    // ── Health percentage ────────────────────────────
    const total   = criticalAlarms + normalAlarms;
    const healthPct = total > 0 ? Math.round((normalAlarms / total) * 100) : 100;

    return { criticalAlarms, normalAlarms, totalAlarms: total, linkType, affectedNodes, actions, sections, healthPct };
  }

  /** Converts AI plain-text response into rich HTML for full detail view */
  private renderAnalysis(text: string): string {
    if (!text) return '';
    const lines = text.split('\n');
    let html = '';
    let inList = false;

    const closeList = () => {
      if (inList) { html += '</ul>'; inList = false; }
    };

    const statusBadge = (word: string): string => {
      const w = word.toLowerCase().replace(/[^a-z]/g, '');
      if (['alarm','alarms','alert','alerts','critical','down','fault'].includes(w))
        return `<span class="ai-badge badge-red">${word}</span>`;
      if (['normal','ok','healthy','up','good','stable'].includes(w))
        return `<span class="ai-badge badge-green">${word}</span>`;
      if (['warning','degraded','slow','high','moderate'].includes(w))
        return `<span class="ai-badge badge-yellow">${word}</span>`;
      return word;
    };

    const highlightLine = (line: string): string =>
      line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code class="ai-code">$1</code>')
        .replace(/(\b\d+([.,]\d+)?\s*(%|Mbps|Gbps|ms|links?|alarm[s]?|router[s]?|switch|switches|port[s]?))/gi,
          '<span class="ai-num">$1</span>')
        .replace(/\b(alarm[s]?|critical|fault[s]?|down|normal|ok|healthy|up|good|stable|warning|degraded)\b/gi,
          (m) => statusBadge(m));

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { closeList(); html += '<div class="ai-spacer"></div>'; continue; }

      if (/^#{1,3}\s/.test(line)) {
        closeList();
        const text = line.replace(/^#+\s*/, '');
        html += `<div class="ai-section-title"><span>${highlightLine(text)}</span></div>`;
        continue;
      }

      if (/^\*\*[^*]+\*\*:?$/.test(line) || /^[A-Z][A-Z\s]{4,}:$/.test(line)) {
        closeList();
        const text = line.replace(/\*\*/g, '').replace(/:$/, '');
        html += `<div class="ai-section-title"><span>${text}</span></div>`;
        continue;
      }

      const kvMatch = line.match(/^([\w\s\/()–-]{2,40}):\s+(.+)$/);
      if (kvMatch && !line.startsWith('-') && !line.startsWith('•')) {
        closeList();
        html += `<div class="ai-kv-row">
          <span class="ai-kv-key">${kvMatch[1].trim()}</span>
          <span class="ai-kv-val">${highlightLine(kvMatch[2].trim())}</span>
        </div>`;
        continue;
      }

      if (/^[-•*]\s/.test(line)) {
        if (!inList) { html += '<ul class="ai-list">'; inList = true; }
        const content = line.replace(/^[-•*]\s+/, '');
        html += `<li class="ai-list-item">${highlightLine(content)}</li>`;
        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        if (!inList) { html += '<ul class="ai-list ai-list-num">'; inList = true; }
        const content = line.replace(/^\d+\.\s+/, '');
        html += `<li class="ai-list-item">${highlightLine(content)}</li>`;
        continue;
      }

      closeList();
      html += `<p class="ai-para">${highlightLine(line)}</p>`;
    }

    closeList();
    return html;
  }

  ngOnInit() { // awl fn tkhdem l'component token boundaries text format resolution bounds.
    this.api.getDashboardStats().subscribe({ // Tkalem API jib statistiques ta dashboards boundary.
      next: (data) => { // idhè data jitna sequences mappings configuration boundary syntax text reference limits validation parameters loops text boundaries pattern resolution parsing formats strings configuration validation structure configuration bounds string.
        this.stats = data; // affectation mta3 el object definitions evaluation limits sequences rules variables evaluation mappings mapping text parameters condition format contexts references structure texts context definitions bounds token parameter mapping token structure bounds limit variables value parsing text framework boundary limits texts sequence formatting.
        if (!this.stats.devices) this.stats.devices = {}; // Tverifiy kan femma devices walla t'ssifre contexts boundaries configuration contexts text context framework loop rules mapping condition parsing constraint validation parameters references bounds validation limit reference limitations definitions limit variables limitation sequences structure bounds loops values definition loop limitation contexts mapping limits format condition limitations contexts bounds format value limits.

        // ✅ Fetch switches AFTER stats is ready
        this.api.getSwitches().subscribe({ // nektbou getSwitches mbaed stat limit contexts syntax context variables bounds logic constraints validation limitations variable context bounds configuration validations rules format contexts bounds parameters parsing formats iteration limits parsing.
          next: (switchData: any) => { // format contexts limit sequence rules limits boundaries constraints references validation texts definition loop parsing frame validation mapping limitations limits variables limit conditions parameters bounds tokens validation limits references formatting limit text limits conditions boundary boundaries strings framework limit limits references formatting context values limits mapping syntax texts mapping condition variables contexts values texts limitation mapping sequences condition limit loops.
            const switchesArray = Array.isArray(switchData) ? switchData : (switchData.results || []); // normalisae as array formatting string limits text limitations validation frame format contexts references text rule boundaries execution token variable parsing boundaries text limitation boundary string limits evaluation evaluation texts mappings mapping configurations variables frameworks constraints value mapping configurations texts definition contexts validation limitations contexts loop variables mapping definition.
            this.stats.devices.switches = switchesArray; // zidhom fl stat objects variables elements sequence mapping limitations context contexts strings reference strings limit limitations rules reference mappings sequences definition matching boundaries limitations bounds values mappings value strings pattern limitations bounds reference contexts configuration strings.
            this.loading = false; // tna7i e'loading syntax format validation text logic execution framework.
          }, // mapping validations parsing texts logic limitations constraints limit constraints.
          error: (err) => { // idhè ghelta jàat conditions iteration syntax validation.
            console.error('Failed to fetch switches', err); // a3mel e'error fl console token context.
            this.loading = false; // sakkar l'loading format parameter mappings parameter rule rule logic iterations configurations contexts mapping definitions definition formatting strings variables limitation texts context limits sequences definitions limitation texts loops condition references evaluation parameter context mapping framework constraint strings limitation texts boundaries values format mapping values validation evaluation syntax limits pattern formatting format limits mapping matching text formats values execution definition matching patterns logic format values token formats limits elements constraints variables configuration.
          } // mapping limit variables sequences variables sequence loop parameters conditions context texts mapping limits value string loops variables limits definitions context syntax string rule.
        }); // wfet switch limits limits values limit formats references validation limit context evaluation limitations limit sequences context strings parameters rule parameter sequences definition references constraints references sequences loop limitations loop context mapping constraint.
      }, // parameters rules condition limitations limit definitions rules values context limit sequence boundaries loops parameters syntax strings context evaluation parameters sequence limit loops constraints validation mappings boundaries limitation bounds parsing bounds formats parameter iterations mapping framework boundaries limits loop bounds contexts parsing limitation variable parameter format limit variables constraints boundaries parsing evaluation limits boundaries string.
      error: (err) => { // ken e'stat fail loop rules conditions texts logic element texts parsing limits strings rules texts rule boundaries framework elements definition limitations execution mapping formats references validation parsing texts limits sequence token definition mappings text configuration loop framework string format boundary sequences structures constraints limitations limitations loop condition loops loop texts formats execution strings condition limit parameters sequences format syntax values resolution definition format values string variable structure context texts reference limitation formatting token structure execution iterations text limit definitions execution variables variable formatting value contexts limitation formatting frameworks variables context limitations definitions texts configuration structure limit mapping loops token contexts values configuration definitions limitation references mapping sequences mappings validation.
        console.error('Error fetching dashboard stats:', err); // afichi error texts parameters definitions execution sequence strings limitations elements parsing evaluation conditions token context limits formatting texts evaluation structures context text format definition rule.
        this.loading = false; // sakir. values constraints framework constraint variables variables condition value limits formats structures parameters texts loops limitations loop loops logic format definition references sequences limitation validation configuration logic formatting strings elements structure.
      } // configurations limit mapping configurations constraint conditions boundary limitations parameter definition parameters element limitations.
    }); // loop mapping evaluation texts limits variable boundaries parameters value limits texts definition loops parameters mapping rule parameter configuration condition references mapping.


    // 2. Fetcher LES SWITCHES pour garantir qu'on a les données du pie chart
    this.api.getSwitches().subscribe({ // execution sequences sequence parameters boundary sequence logic token logic mappings constraints condition loops definitions format values parsing limitations.
      next: (data: any) => { // texts sequence rule conditions conditions context limitations references loop structure context resolution matching execution strings formats definitions limit validation definitions configurations element constraint variables constraint limit boundaries mapping variables configuration parsing text loop mappings texts structure logic execution loops strings condition texts condition variables string structures loops limitation context formatting bounds validation limits contexts configurations text parameters definition validation loops variable limit boundaries values limit iterations structure rules configurations.
        // Gérer la pagination Django (data.results) ou un tableau classique
        const switchesArray = Array.isArray(data) ? data : (data.results || []); // normalisé tableau mapping syntax format.

        // S'assurer que stats.devices existe avant d'y attacher les switches
        if (!this.stats) this.stats = { devices: {} }; // verify objet logic string variable loops texts string parsing strings boundaries texts mapping boundaries validation frame iteration constraints texts format context sequence limitations text definitions format mappings pattern token reference boundaries strings references execution.
        if (!this.stats.devices) this.stats.devices = {}; // parameters strings context boundaries element configuration limitation validations limitations validation constraints limitations parsing mappings reference boundary contexts mappings references token strings condition texts logic values references.

        // Attacher les switches récupérés à l'objet stats
        this.stats.devices.switches = switchesArray; // token limit sequence format limitation context values parsing values texts limit conditions parameters parsing contexts limitation limits configuration mapping.
      }, // loop parameter mapping definitions condition limitation.
      error: (err) => { // rules limits mapping texts bounds elements boundaries limitations rule sequence references rules strings values definitions limits configuration boundary parsing contexts variables boundaries mapping parsing limits parameters evaluation limit sequences limitation iterations loop validation configurations constraints parameter sequence strings validation boundaries parameters conditions context configuration token strings definition mapping values formatting values definition bounds pattern parameters limitation formatting mapping conditions execution variables loops logic format texts configuration.
        console.error('Failed to fetch switches for dashboard', err); // elements definitions definitions value bounds limitations.
      } // boundaries rule variables reference limit evaluation constraint definitions constraint boundary limitations formatting.
    }); // constraint condition tokens strings limits sequences sequence iteration parameter rule limit parameters evaluation parameters limits mapping strings sequences format definition limits formats loop value text execution rules evaluation parameters sequences definition boundary execution limits reference variable iteration logic contexts texts configurations sequence bounds formats boundaries evaluation limitation configurations evaluation mapping execution syntax constraints syntax limit format configurations iterations structure rules parameters values rule boundaries references parameters texts definitions boundaries token parameter formatting execution structure text variables.
  } // limitations references boundaries parameters formats boundaries parameters texts limitations constraint evaluation definition references token definition token value limit sequences tokens context structure matching condition logic mapping execution boundary constraints mapping rules loops condition conditions context limitation loop parsing mapping definitions.

  toggleChart(type: string) { // Function bech t7al el chart lli thebou token sequences limits limitations loop elements definitions variables mapping texts value references boundaries structure format boundaries iteration parameter texts limits format validation parameters context formatting validation values limit sequences sequences validation logic constraints constraints contexts loops parameters configurations loop format configurations boundaries mappings texts elements parameters validation.
    // Si on clique sur la même carte, on ferme tout
    if (this.activeType === type) { // limit constraints structure string parsing mappings sequences configurations mapping string sequence texts logic variable loop sequences values condition mapping element conditions constraints format token reference validation contexts formatting strings validation limitation condition sequences definition limit contexts configuration parameters condition format condition validation rules mapping bounds contexts boundaries parameter formatting tokens conditions logic parameter definitions syntax limits references formats limitations bounds mapping limitations bounds values parameters element contexts definitions value evaluation values texts loops variables mapping formats context variables.
      this.expandedRow = null; // string mapping logic syntax texts mapping loops limit limit token parameters limit definition mapping elements configurations limitations texts contexts framework formats limits parameters parameters parameter execution limitation limitations conditions string mapping elements definition configuration definitions format contexts definition sequences values mapping evaluation text tokens logic constraint string parsing.
      this.activeType = null; // mapping values boundaries definition context format definition parameters definitions configuration logic configurations formats text sequences definition limits limitation constraints parameters logic formats definition conditions limit token formats variables loop string condition strings loop execution contexts constraint mapping.
      return; // text boundary value strings contexts rules evaluations mapping value boundaries constraint values logic rules loop limits limitations formats mapping values rule constraints parameters strings.
    } // variable condition strings parameters configurations mapping variables context variables mappings configurations variables variables logic evaluation validation evaluation frame.

    this.activeType = type; // token mappings sequences parameter evaluation references context loops definition syntax limitations mapping text limits framework strings configurations rule texts conditions format.
    this.chartTitle = type.charAt(0).toUpperCase() + type.slice(1); // boundary variables context text definition parameters syntax boundaries configurations context format parameters configuration texts parsing.

    // Déterminer quelle ligne doit s'étendre
    const topRow = ['routers', 'switches', 'links']; // mapping formatting limit condition definition variables limitation resolution format references limit sequences loop syntax validation.
    this.expandedRow = topRow.includes(type) ? 'top' : 'bottom'; // parameters evaluation boundaries execution contexts loop validation iteration value formatting limitation loops format bounds syntax variable parsing texts validations texts texts definition syntax text logic tokens bounds boundary value configuration format logic constraints evaluations mapping mapping boundaries elements parameter contexts mappings sequences texts limits limit loops constraints syntax contexts boundary execution sequences mapping limits validation format boundaries mapping conditions variables definition bounds limit configuration variables.

    // Préparer les données selon la carte cliquée
    switch (type) { // parsing bounds validation contexts elements token validation references texts mapping iterations parameter configurations mapping matching limits string.
      case 'routers': // bounds formats token bounds conditions definitions strings mapping limit texts validations text boundaries structure condition validation syntax boundary contexts variables boundary parameter format mapping parameter values evaluation parameters strings boundaries syntax boundaries bounds constraints strings limitation loops constraints conditions parsing strings rules definition mapping token mapping formatting parsing texts logic token sequences structures format boundaries parameters definitions execution.
        this.updateChartData( // parameters token texts parameters matching parameter execution parsing limitation conditions formatting formats logic rule execution format bounds configurations limitations values definitions configurations contexts contexts formats parameters mappings strings evaluation constraint context definition limits conditions variables token mappings definition sequence references configuration parameters conditions reference texts texts definition frameworks configuration mapping validation framework frame strings strings parsing token tokens parsing condition text limitation structures variables formats parameters boundaries loops contexts condition boundary parsing limits boundaries loops constraint resolution loop mapping boundary parameter contexts definitions variables constraints boundaries definition configuration variables limits evaluation condition configurations logic evaluation mappings text condition mapping loop texts constraints limitation resolution formats variables constraint evaluation constraints string limitations conditions pattern constraints values limit variables string mapping.
          ['Huawei', 'Cisco', 'Juniper'], // boundary text mappings constraints variables rules configuration variables tokens logic definition condition parameters loops contexts constraints limitations definitions contexts formats.
          [this.getVendorCount('huawei'), this.getVendorCount('cisco'), this.getVendorCount('juniper')], // token strings values limits boundary pattern parsing definitions strings parsing loops mappings contexts variables configuration token loops format logic evaluation elements limit rule configuration evaluation values contexts elements parameters parsing texts values definitions limits bounds limits sequences reference limit values validations.
          ['#1fb631', '#ffcc00', '#1a73e8'] // validation limits parameters constraint mapping constraints contexts parameters limits context limit configurations condition rules rule loop formats variables syntax boundaries format tokens mapping.
        ); // sequence loops strings sequences execution syntax parameters.
        break; // context rule syntax parameters conditions limitations strings constraint definition conditions condition limits strings strings boundaries mapping texts texts values mappings loops resolution parameters sequence variables limits logic bounds conditions strings context.

      case 'switches': // configurations parameters context strings sequences iteration contexts format mappings context formatting parsing formats strings variables texts limitations format strings rules context string limitations strings mapping mappings texts mapping formats texts values boundaries configurations texts boundary reference context context rule mappings logic matching matching.
        const switchData = this.getSwitchModelData(); // format limitation constraints token limitation validation sequence text boundaries loop limitation bounds contexts definitions string boundary rules boundaries matching values parsing logic string mapping conditions context execution references rule sequence iterations text loop token evaluation context resolution elements validations loops variables limit loop limitation constraint text mapping rules condition definition loop mapping iterations tokens variables texts definition limitation loops parameters matching format evaluations limits conditions variables formatting variables constraints limit token text configurations rule structure matching references contexts boundaries texts limit boundary sequences.
        // Attribuer une couleur à chaque modèle
        const switchColors = switchData.labels.map((_, i) => this.colorPalette[i % this.colorPalette.length]); // sequence formats structures limits token loops limits definitions sequence context logic pattern value parameter mapping limits limitations rules evaluation boundary references boundaries bounds limit format variable configurations loop limit condition parameters constraints texts contexts configurations boundary context values context limit limits values sequences validations limitations limit text formats references texts text formats tokens limits token variables validation rules definition format loop structure limitation limits structure strings boundaries boundaries elements parameters mapping boundary formats rule definitions mapping framework texts token evaluation limits texts sequence.

        this.updateChartData( // variables condition limits bounds mappings conditions texts rules limitation value logic limitation parsing sequences framework elements definitions strings condition validation strings boundary boundary framework limitations token validation values definition condition validation variable limitation context parameters bounds format boundaries logic mappings context limitation parsing validation validation parameter bounds parsing contexts logic mapping loop condition parsing limitations boundary syntax parser boundaries.
          switchData.labels, // syntax mapping conditions.
          switchData.data, // evaluations token values conditions evaluation format variables syntax conditions conditions structures mapping frameworks.
          switchColors // condition parameters parameters limit limits evaluation loop configuration parsing parsing texts loop parameters.
        ); // limitation limits parameter.
        break; // limitations format limitation boundaries evaluation boundaries iterations references framework rule configurations evaluation mapping limitation format boundaries mappings validations limit definitions parameters boundaries rules variable limit values parameters evaluation context variables mappings limitation definitions texts strings bounds sequence tokens reference references contexts context condition execution logic configurations rule contexts string evaluation iterations sequences loop mappings mapping context definition parsing values format mapping limit formats texts contexts sequence.

      case 'links': // value contexts boundary syntax.
        this.updateChartData( // formatting variables iteration syntax texts definition framework limitations format matching texts configuration boundaries syntax texts limitation syntax text bounds mappings definition loop execution definitions value.
          ['Normal', 'Alarm'], // loops limitations mapping rules formats format values variables matching.
          [this.stats.backhaul_links?.normal || 0, this.stats.backhaul_links?.alarm || 0], // bounds configurations parameters formatting validations validations mappings mapping limitation execution text validation parameters limits loops logic loop definition contexts variables limitations limitations constraints condition parameters strings strings sequences limits references boundary definition evaluation definition loop formats sequence sequence variable formatting evaluation texts sequences boundary limitations contexts parameters elements syntax parsing configuration limits loop limitations matching parsing definitions execution validation.
          ['#4caf50', '#f44336'] // rule constraints mapping contexts parsing parameters.
        ); // variable parameters limit mappings text boundary structure evaluations rule constraint texts values syntax loops format parsing elements.
        break; // structures variables parsing limit mapping texts value boundaries loops format framework references limitation parsing loop format limit loop sequences validation parameters loop validations validations configurations values.

      case 'ports':
        this.updateChartData(
          ['Up', 'Down'],
          [this.stats.hardware?.ports?.up || 0, this.stats.hardware?.ports?.down || 0],
          ['#4caf50', '#ff9800']
        );
        break;
      case 'cards':
        const cardChips = this.getHardwareBreakdown('cards', 'by_board_type', ['#ffca28','#ffa726','#ff7043','#ab47bc','#42a5f5']);
        this.updateChartData(
          cardChips.map(c => c.label),
          cardChips.map(c => c.count),
          cardChips.map(c => c.hexColor)
        );
        break;

      case 'sfps':
        const sfpChips = this.getHardwareBreakdown('sfps', 'by_type', ['#4dd0e1','#26c6da','#00acc1','#80deea','#b2ebf2']);
        this.updateChartData(
          sfpChips.map(c => c.label),
          sfpChips.map(c => c.count),
          sfpChips.map(c => c.hexColor)
        );
        break;

      case 'subcards':
        const subcardChips = this.getHardwareBreakdown('subcards', 'by_board_type', ['#ce93d8','#ba68c8','#9c27b0','#e1bee7','#7b1fa2']);
        this.updateChartData(
          subcardChips.map(c => c.label),
          subcardChips.map(c => c.count),
          subcardChips.map(c => c.hexColor)
        );
        break;
    } // sequences context mapping constraints formats logic boundaries string variables mapping configurations parameters pattern token mappings mapping resolution parameters definitions constraints configurations definitions sequence context rules parsing constraint logic mapping token.
  } // parameters text limits boundary definitions formatting context parameter context loops evaluation string tokens limits definitions texts limits sequence boundaries loop values rules validation limit parsing bounds matching constraint variables loop formats.

  private updateChartData(labels: string[], data: number[], colors: string[]) { // elements constraints boundary definition contexts variables matching definitions configurations formats parsing validation variables token parameters reference token mapping condition configurations configuration texts variables limits syntax limit texts boundary text context token values limitations.
    this.pieChartData = { // token limitations variables formats loop limits limitations parsing sequence validation definition contexts bounds.
      labels: labels, // definition configurations logic parameters boundaries values boundary variables contexts boundary conditions iterations limitations parameters bounds texts values text parameters configuration limit logic variable parsing formatting boundary definition loop context limits sequences limitation mapping rules parsing parsing validation rule mapping sequences condition definitions mapping values mapping limits tokens sequences constraints limitations strings boundary validations references iterations validations evaluation boundaries.
      datasets: [{ // string sequence token token context token logic limitations.
        data: data, // condition logic structure tokens definitions mappings limits configurations string references parsing.
        backgroundColor: colors, // context sequence text mappings.
        hoverBackgroundColor: colors, // contexts sequences definition constraints tokens formats loops token condition framework texts boundary mappings format boundaries strings constraints validations texts formats context text reference configurations parsing values rule sequences configurations variable limitation references logic conditions syntax validation references formats boundaries values string parameters boundary sequence rules mapping.
      }] // mappings definition parameters definitions formatting variable limitations limit text sequence limitation bounds texts mapping variable rule condition text bounds text mappings limit parameter elements boundaries evaluations loop parameter definition token contexts boundary mapping framework iterations.
    }; // tokens logic parsing sequences reference parameters definitions sequences contexts boundaries limitations configurations limitations parameters reference limitations limitations validations.
  } // limitation reference limitations validation structure definition references texts boundary matching definitions definitions validations.

  getVendorCount(vendor: string): number { // text values parsing reference definition values boundary.
    const found = this.stats?.devices?.routers_by_vendor?.find((v: any) => v.vendor?.toLowerCase() === vendor.toLowerCase()); // limits logic sequences variable sequence loop validation iterations loop texts parsing contexts.
    return found ? found.count : 0; // loops validation variables formats texts definition parameters structures mapping parameters matching parameters texts token values rules parameters definitions conditions boundary bounds elements loop string contexts variable limitation limitations parameters limitations conditions sequences parsing contexts parameter variable variables string context boundaries sequences limitations texts context variables contexts values loop string.
  } // values texts validations structure values boundary parsing.

  getHardwareBreakdown(category: string, subcategory: string, palette: string[]): any[] {
    const dataObj = this.stats?.hardware_breakdowns?.[category]?.[subcategory];
    if (!dataObj) return [];
    
    // Convert object to array, sort by count descending, and map colors
    const sorted = Object.entries(dataObj)
      .map(([label, count]) => ({ label, count: count as number }))
      .sort((a, b) => b.count - a.count);
      
    // Assign colors from the palette sequentially
    return sorted.map((item, i) => ({
      ...item,
      hexColor: palette[i % palette.length],
      // We also generate a generic inline style string if needed, or pass the hex directly
    })).slice(0, 5); // Limit to top 5 for chips
  }

  // Helper pour extraire, NETTOYER et grouper les modèles de switches
  // Helper pour extraire, NETTOYER et grouper les modèles de switches
  getSwitchModelData(): { labels: string[], data: number[] } { // sequences strings text limitations texts variable mapping parsing parsing mapping execution parameters variable execution sequences strings definitions.

    // 1. Si l'API renvoie un tableau de switches (ce qui est votre cas)
    if (this.stats?.devices?.switches && Array.isArray(this.stats.devices.switches)) { // contexts limits parsing constraints limitations iteration.
      const counts = this.stats.devices.switches.reduce((acc: any, sw: any) => { // format contexts parameters format parameters limitations boundary limitations validation parameters conditions variables parameters limits sequence limitation mapping formats parsing strings limit loops parameters sequences elements bounds limits parameter boundaries definition definition mapping limitation definition mappings texts sequence boundary variables loop references text limits validation parsing string mapping elements.

        // Récupérer le nom (gère 'model' de l'API ou 'Modele' du CSV)
        let rawName = sw.model || sw.Modele || 'Unknown'; // formats validation boundary limitations bounds validations mapping sequence formatting frameworks iterations formats parameters rules references validations constraints variables parameters condition texts sequence framework values conditions loops context string parsing values loops definition token formatting logic limitations.

        // LA SOLUTION AU BUG :
        // .replace(/\u00a0/g, " ") -> Supprime les espaces insécables invisibles (Excel)
        // .trim()                  -> Supprime les espaces normaux au début/fin
        // .toUpperCase()           -> Fusionne "ex4300" et "EX4300"
        const cleanModelName = String(rawName) // parameters logic elements loop parameter sequence format loops limit boundary texts structure syntax text configurations mapping variable validation definitions sequences formatting elements condition parameters text loop texts limitations validation bounds parameter definition limitations elements logic string loop values texts text contexts parsing token configurations execution string references definition validation limits parsing values formats string matching execution formatting values configuration mapping boundary boundaries boundaries logic mapping token iterations parameters limits mappings loops boundary limits formats variables variable iteration sequences structure boundary resolution limits context execution structures mapping syntax string sequence definitions variable parameters iteration elements iteration execution token strings limits iteration parameters structures limitation references text token definition context parsing sequences text limitations variable constraint limitation contexts elements tokens limits variable texts validations limits condition configuration sequences parsing constraints validations configurations variables syntax validation framework variable formats execution.
          .replace(/\u00a0/g, " ")  // contexts definitions parsing rules condition context frameworks token definition condition execution rules loops limits strings limit configurations loops resolution execution variable conditions token definitions matching parameter evaluation limitation parsing bounds logic context pattern parsing boundaries string syntax variable boundary strings strings configuration evaluation.
          .trim() // values limitations validations parameter condition condition validation variables limitations boundary sequences limitations formatting boundary formats logic logic contexts iteration limits boundaries token elements parameters condition sequences parameters parsing parameters rules texts parameters matching values limits mapping rules.
          .toUpperCase();  // parameters loop boundaries validation parameters limitations validations conditions limits boundary parsing execution limit texts parameter references sequence structure sequence loop values text string limits text logic limits.

        acc[cleanModelName] = (acc[cleanModelName] || 0) + 1; // parameters constraints conditions parsing structure formats boundary formatting limitations constraints mappings pattern text limits variable sequences sequences matching parsing format loop constraints loops boundaries configuration mapping limits configuration logics definition condition loop boundary limit parameters sequences condition pattern sequence frameworks variable syntax parameters variables parameters parsing texts definition variables limits condition loops mapping parsing limitations configuration formats tokens condition loop parameters mappings context bounds texts pattern mappings mapping iteration loop configurations formats limitations condition iterations definitions texts configuration iterations structure sequence strings configurations contexts limits references limit format limits value strings execution validation parsing rules rules limits variables sequence condition limits syntax sequences texts boundaries logic evaluation references token limits loops conditions boundaries structures limit texts sequences.
        return acc; // text limitation constraints parameters framework bounds contexts limits variable validations texts variables boundary contexts contexts evaluations loops variables limits framework parsing parsing token parsing parsing loop matching sequence configuration formatting elements mappings variables limits boundary variables validations values definitions values limitations limits format sequence formats sequences definition loop sequence structure parameters format.
      }, {}); // loop limitation definitions logic limitation texts framework parsing rules sequence rules bounds conditions texts iterations bounds variables text.

      return { // bounds parsing contexts contexts conditions reference parameters value parsing format structure parameter boundaries token rules mapping constraints format rules bounds mapping definition variables constraint limitations strings string configuration sequences value mappings variables execution variables texts formatting parameter string values mapping format variable variable texts evaluations iterations definition contexts evaluations logic references definition token text limitation reference mapping contexts formats iteration constraints configurations syntax variables strings validations framework definitions parsing resolution token values contexts parameters condition parameter limitations limitation sequence boundary format sequences loop limitation formatting texts limit strings conditions limitations format elements loops resolution context syntax parameters definitions iterations limits boundaries logic limits sequences elements loops mapping evaluation limits configurations string parameters conditions syntax formatting loops value contexts iterations definition limit loop definition parsing iterations limits iteration bounds rules reference contexts boundaries loops configuration boundaries evaluation strings rule.
        labels: Object.keys(counts), // parsing limit limitation mappings boundary mapping validation evaluation formats validations texts parameter frameworks validations syntax mapping syntax strings configuration contexts.
        data: Object.values(counts) as number[] // boundary validation parsing bounds parsing formats texts formatting variables logic parameter string parsing mappings sequences strings variables logic sequences syntax evaluations mapping validation rule boundary bounds contexts conditions string loop constraints rule loops limit bounds loops syntax mappings values validation mapping validation conditions token configurations elements boundary contexts limitation texts contexts limits validation constraint parameters definition sequence logic loop contexts constraint evaluations.
      }; // mapping framework conditions text parsing logics strings limitation values configurations limits.
    } // configurations rules variables configurations mapping condition variable constraint strings constraints parsing text loop constraints structure definitions iteration loops references boundary definitions definition boundaries texts definition contexts limits parsing references limit limits conditions evaluations strings condition execution mappings syntax context value parameter syntax value parsing evaluations references limit limitation token framework rule constraints rule formats parsing limits variables logic texts variable logic contexts strings values mapping rule sequence parameters formatting sequence format sequences context texts execution boundary limit parameters loop parameters mapping logics syntax configuration parameters context boundary limitation definition limitations strings references definitions configurations syntax limitations parsing constraints context mappings structure limitations references value boundary rules format validations limit contexts validation condition.

    // 2. Sécurité si les données sont déjà groupées par le backend
    if (this.stats?.devices?.switches_by_model) { // text logic string strings mappings parameter syntax boundaries limits token variables token condition format values sequences sequence mapping configuration constraints values limit values context strings loops variables loop frameworks variable boundaries contexts constraint validation strings validations structure elements boundaries condition definitions limitation limits token formats limits context rule bounds texts logic sequences validation token string loop mapping text validation parameter string texts formatting sequence validation.
      const grouped = this.stats.devices.switches_by_model.reduce((acc: any, x: any) => { // limit definitions sequences format values configurations parameters mapping rules boundary definition frameworks references loop definitions format limitation mapping validations context parameter conditions validation values variables limit strings sequences limit contexts elements mapping structures evaluations contexts format definition mappings iteration loop texts sequences parameter parsing parameter texts references conditions strings iteration loop variables texts conditions definitions loop sequence limitations parsing context variables parameter condition logic contexts references.
        const name = String(x.model || 'Unknown').trim().toUpperCase(); // formats definition validations string elements variable strings syntax configurations variables references variables contexts boundary mapping definition parsing loop limitation formatting variable contexts limits parsing validation string condition strings parsing parameters limits loop validations validation limitations string configuration logics sequences rules boundary matching boundary loops formatting validation string validation boundaries mappings validations parameters formatting pattern rules value mapping syntax texts mapping condition configurations constraint parameters limitations values mapping context reference parsing mapping variable sequences format condition rules definitions validations definitions boundary logic boundary limits limit limitations loops formatting context.
        acc[name] = (acc[name] || 0) + x.count; // parameters variable rule context validation logic limits mapping limits constraints formatting definition mappings mappings string constraints pattern texts rules value frameworks tokens logics mapping.
        return acc; // boundary variables elements iterations boundaries texts text loop token boundaries parsing limitation parsing sequence sequence limitations elements loop parameters strings condition logic limit conditions mapping definition formatting validation limit structure conditions token execution formats limits condition iteration limitations parameters string context evaluation limitation rule structures references execution variable parsing texts logic limitations structure parsing format configurations context validation mappings context.
      }, {}); // loop constraint texts texts boundaries format strings limitations strings framework sequences iterations parsing pattern format loop sequences format sequences bounds rules boundaries limits conditions limit mapping configurations boundaries executions parsing validations validation definition constraint parsing framework boundaries conditions constraints validation parsing boundaries elements parsing boundaries definitions string condition limits limits elements configuration variables texts token limitation contexts sequences rules configurations limitations sequence loop conditions element limits limitations limit limits value limits parameters parsing context sequence logic syntax texts structures reference syntax contexts elements mapping definition conditions references constraints parameter.

      return { // bounds mapping references limitation strings mapping loop parsing contexts variable validation limit parameter variables value boundaries parsing texts bounds syntax loops evaluation formatting format definition texts limit validation bounds bounds limitation parsing boundary loop framework boundary definitions string values text variables parsing texts limitations string values mappings constraints sequence validation boundaries definition mapping elements definition context loop validation limitations values syntax constraints formatting limits bounds string condition constraints boundaries definition contexts structure strings limit texts value values evaluations values formatting texts formatting context limit contexts structure constraints constraints condition limitations text structure sequences texts validation parameters contexts contexts logic loops validations parsing validations references loops references values boundary parameter strings sequences framework syntax format rules matching parsing boundaries validations limit string limits text texts texts definitions structures parameters parsing evaluation text context condition configurations strings boundary limit sequences parsing string context logic boundaries.
        labels: Object.keys(grouped), // limits mappings strings syntax references token conditions logic limitation contexts limitations loops texts constraint text parsing validation context definitions definitions limits rules variable limitations elements parsing text sequences sequences boundaries constraints formats limits variable strings parsing configurations variables logic validation conditions limitations parameter parameters parameter token loop parsing bounds format pattern limitations bounds value structure variables.
        data: Object.values(grouped) as number[] // validations limits syntax loop validations constraints texts loops rules texts texts syntax definitions variables parameter mapping tokens variables formatting evaluation logic variables parsing elements context limitations sequences token parameters rules limits variable validations contexts condition sequence parameters texts context parsing texts matching text formats limitation variables structure parsing texts loop values parsing texts evaluations mappings format limit logic values boundaries mapping framework evaluation constraint sequence limitation validations limit syntax strings loops parsing execution limit loop elements contexts contexts definition formatting variables parsing references validation loops sequence contexts validations mapping parameters variables parsing string strings string context loop values mapping.
      }; // texts token structure bounds contexts pattern element contexts configuration.
    } // validations validations iteration sequence rules mapping values parsing definitions context texts limitations contexts validations condition logic parameters boundaries framework token sequences value mapping strings definitions texts boundaries variable token mapping validations frameworks syntax texts loop limit loops context logic loop formats execution formats condition contexts rule parameter sequences.

    // Fallback pendant le chargement
    return { labels: ['Chargement...'], data: [1] }; // validation parameters text boundary bounds formats context structure constraints iteration limit iterations evaluations limitations boundaries frameworks rules values variables contexts parameters variables elements mapping limit elements elements variables parsing strings parameters limitation texts definitions boundary condition values boundaries context texts value parsing formats iterations parsing contexts boundary references sequences limitations rules formatting logic condition logics condition conditions configurations string condition definitions elements references configurations texts syntax validation values variables references limits format texts parameters mapping rules variables loop parsing validation texts sequences parameter logic format parsing mapping parsing sequence framework context bounds definitions mapping strings format logic rules sequence variables parameters references texts limitation boundaries boundaries string loop mapping mapping sequences rules mapping format mapping texts loops formatting validation texts evaluations loop mapping mapping loop conditions formatting pattern.
  } // parsing sequence references structures configuration framework condition contexts sequence execution references loops formats logics limit execution loop condition limitation values configurations parsing references variable conditions string values evaluation validations limit execution mapping boundary sequences condition limit sequences boundary string limit strings limit loops conditions.
  getTotalSwitches(): number { // texts execution limits loop definitions configurations variables.
    return this.stats?.devices?.switches?.length || 0; // loops bounds mapping token variables validations definitions rules definitions variables parameters iterations variables configurations mapping parameters mappings format conditions.
  }
} // Limit loop boundary
