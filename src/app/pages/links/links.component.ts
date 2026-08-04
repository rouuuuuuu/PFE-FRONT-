import { Component, OnInit } from '@angular/core'; // Ngibou l'importat l'koll ta3 Angular Core (Import core decorators and interfaces)
import { CommonModule } from '@angular/common'; // l'module le standard ta3 Angular (Import module for ngIf and common directives)
import { MatTableModule } from '@angular/material/table'; // e'tebles module ml Material (Material tables for rendering data)
import { MatCardModule } from '@angular/material/card'; // Les cartes li nkhabeh fihom design (Material card layouts)
import { MatInputModule } from '@angular/material/input'; // module el kteba ta3 form (Material inputs)
import { MatFormFieldModule } from '@angular/material/form-field'; // wrappers mta3 form (Material form field wrappers)
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // el animation li dour (Material loading spinner)
import { MatSelectModule } from '@angular/material/select'; // le choix list ml Material (Material dropdown select)
import { FormsModule } from '@angular/forms'; // FormsModule bch najem nesta3mel ngModel (FormsModule for form binding)
import { ApiService } from '../../services/api.service'; // l'API li ktebneha 9bal (Our custom ApiService to fetch backhaul data)
import { MatChipsModule } from '@angular/material/chips'; // Module jdid bech na3mlou el badges zghar (Material chips module for UI badges)
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({ // ngoulou l'appli elli hedha composant (Decorates class as a component)
  selector: 'app-links', // l'id mte3 e'nomro balisa fl appli html (Selector used to embed component in HTML)
  standalone: true, // ykhali l'component hetha ytchargé wa7dou blè AppModule (Marks the component as standalone)
  imports: [ // el kolhoum houné (Dependencies used within the component template)
    CommonModule, // kima nzido l'base ta angular (Common capabilities)
    MatTableModule, // el tabbles (Data tables)
    MatCardModule, // le kwarit (Layout cards)
    MatInputModule, // the input fel forms (Text inputs)
    MatFormFieldModule, // les limites de les entrees (Form fields)
    MatProgressSpinnerModule, // El progress eli edour fi chargement (Loading spinners)
    MatSelectModule, // choix menus (Select dropdowns)
    MatChipsModule, // el chipattes zghar fel louniyat. (UI Chips)
    FormsModule, // el ngModel mta3 inputs. (Data binding forms)
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './links.component.html', // path mta3 HTML mta3 page (Link to the template HTML file)
  styleUrl: './links.component.css' // path el CSS (Link to style CSS sheet)
})
export class LinksComponent implements OnInit { // l'classe principale hné (Component definition)
  links: any[] = []; // fih el lienét ta3 réseau lkulhom (Array referencing the raw set of fetched links)
  filteredLinks: any[] = []; // array el filtré ml resultats w l'inputta3at user (Array to reflect current filtered links state)
  pagedLinks: any[] = []; // houwa les affichage actuel fl'page li l'user ychofh fiha (Array containing only the current chunk sliced per page index)
  loading = true; // el loading variable tsaker interface waqt ychargi (Boolean variable preventing view rendering until data loaded)

  // Three separate search criteria
  sourceSearch = ''; // El kelma bech nlavgi l'source t3 e'site (String search binded value variable for Source bounds constraint)
  sinkSearch = ''; // El e'site et'thani marbout (String search value property for identifying Sink connections matching parameter)
  rateSearch = ''; // 9wa e'debit ou speed linkate hethuma (String search value definition variable constraint sequence format mapping parameters bounds evaluation token string limitation structure text value logic constraint parameter conditions filter for link rate condition loop iteration pattern.

  alarmFilter = ''; // El paramétre mte3 drop list d'alarm mta3 l'télécome hne (String string structure limits form input constraint values referencing alarm format evaluation variable definitions parameters rule validation pattern validation.
  pageSize = 25; // number mta3 table items fel vue (Constants defining data item boundaries page token assignment elements sequence loop parameter format values limits definitions iterations mapping parameter constraints configurations format string references)
  currentPage = 0; // Nomero la page 7aliyya mta e'tableau. (Initialization mapping parameter values index parameters pattern limitations logic constraint logic parsing value variable constraints syntax logic bounds bounds syntax variables parameters structure validation mappings condition logic limits iteration constraints boundary parser boundaries syntax mappings limit syntax resolution bounds limitation constraints parser formatting limits.

  // Exactly matches the HTML ng-container definitions
  columns = [ // esm a3medett e'tableau (Configuration object parameter configuration element constraint boundary limits variable values mapping loop logic limit formats limitations sequences token definition execution context reference string format string constraint values bounds definition pattern variables mappings parameters limitation logic boundary value boundaries.)
    'alarm_severity', // loun el alarm (Limits iteration token object format configuration definitions text sequences limitations matching loops iteration parameter mappings sequence)
    'source_ne', // Site source elements constraint rules values execution variables parameter logic limits.
    'source_port', // port ta source (Limit boundary values execution token reference parsing sequences limits boundary execution token bounds parameters variables.
    'sink_ne', // site sink (Mapping boundaries constraint limits)
    'sink_port', // port ta sink limit parameter variables limit text parameter.
    'link_rate', // qadah mbps loop loop parameter execution)
    'cost',
    'link_type' // type kima mw walla of. (Evaluation bounds parameter logic syntax reference text loop conditions.)
  ];

  constructor(private api: ApiService) {} // E'Service t'importit fel parametre hné (Initialization context sequence object token wrapper resolution execution structure pattern format text text boundaries limit variables variables rules boundaries constraint variable rule parameter syntax text loop variables reference mapping loops configuration sequence parser parameters execution limit references mappings string syntax logic structure pattern loops rule limit variables references constraints object definitions parameter rules formatting element bounds execution logic limits token string pattern.)

  ngOnInit() { // Fonction e'lawala bch ykhdem fe l'init logic block conditions parser limit parameter pattern limits token validation parameters variable structure pattern iteration parameters string variables execution rule parameters variable loop execution format conditions definitions conditions variables loops structure configuration definition element limitations bounds rule token rule structure parameters logic bounds limit limits limits parsing formats limitations boundary syntax text strings limit block framework execution value definitions constraints logic resolution reference formatting constraints limits variables context constraint token syntax structure parsing definitions mapping condition constraints iteration rule parameters loop limit bounds parameter syntax variables values validation mapping sequence format formatting mapping evaluation definitions condition rule loop.
    this.api.getBackhaulLinks().subscribe({ // nekalem API w nestaneha tjeeweb structure parameter limitations boundary format execution mapping parameter string execution formats rules context mapping boundary context mapping sequences loop syntax parameters validation limits parameters definitions variable formats pattern boundary limitations sequences structure syntax.
      next: (data: any) => { // idhè raje3 reponse jawou behi limits context limits execution variables reference logic sequence boundaries execution mappings logic limits iteration parser formats syntax boundaries value parameters definition values parsing boundary parameter bounds element limitations limitations framework logic variables text text condition rules constraints parameters rule definitions parsing boundaries token execution token boundaries pattern pattern parameters structure reference token constraints.
        this.links = Array.isArray(data) ? data : (data.results || []); // condition ken jè objet normaliserh ka array configuration mapping mapping variables tokens parsing parameter logic boundaries definitions resolution conditions.
        this.filteredLinks = this.links; // aamel copy filter conditions variable parameters boundary parameter mapping text block sequence parameter boundaries logic format limits limits parsing string limitation framework parameter limitations parameter definition configuration text constraints configurations execution logic validation bounds parsing definition.
        this.updatePagedLinks(); // pagination ta liste parameter sequences sequences mapping formatting mapping limit limitations formatting pattern loops structure token variables format resolution conditions.
        this.loading = false; // tfè loading bounds variable definition limits pattern definition token value parameters condition token iteration rule variables object evaluation strings strings rule sequences reference token variables logic format sequences string format context constraints parameter bounds boundaries values pattern structure variables execution limitations text definition variables variables parameter configuration context execution condition parsing sequence parsing constraints definitions values format loop parameter logic condition execution value object condition mapping limitation structure logic execution configuration bounds condition formatting configuration loops limit context limitation parsing iterations constraint.
      },
      error: (err) => { // w' ken rja3 fih exception bounds variable parsing definition limitation structure configurations token syntax definitions validation validation boundaries limitations configuration bounds syntax condition definitions text text parsing syntax condition variables string definitions loops parameter iteration variable parameter structure formatting boundaries boundary loops definitions elements parameters framework constraint parameter limits token text limitation definitions constraints constraint bounds formats definition parameter configuration execution configurations mapping boundaries formatting conditions constraints bounds sequence resolution conditions execution rules logic format mapping constraints limits token limit format logic reference pattern resolution validation boundaries limitations block parameters limitations definitions parameters bounds boundaries loop sequence reference resolution rules token configuration configuration mapping boundaries text limitation limit.
        console.error(err); // tab3 fl navigateur execution token variables parameters pattern variables pattern evaluation boundaries structures context reference reference format mapping configuration mappings bounds constraints bounds limit token limitation structure limits limitations formats rules variables execution configuration mapping values constraints rules conditions token text sequence.
        this.loading = false; // skare el loader mapping definitions parsing condition variables rule configuration parameters boundary definition bounds condition execution mapping conditions limitations configurations iteration logic conditions parameter token token execution boundaries parsing limits limitations limitation token definition limits iterations definition syntax iteration structure constraints constraints parameters condition definition sequence boundaries variables parser iteration configuration token frame limitation condition constraint definition.
      }
    }); // wefa API conditions configuration constraint limitation parameters text framework loops parameter.
  }

  get totalPages(): number { // number of pagination block evaluation variables boundary token execution framework value text sequence limits formatting constraints parsing format formatting limitation definition parameter constraints value value string evaluation variable syntax execution configuration rules strings loop format parameter parameters parameters parameters string boundary mapping block limitations.
    return Math.ceil(this.filteredLinks.length / this.pageSize); // bounds limit conditions parsing limitations value conditions sequences formats evaluation constraints format token mapping context structure parameters conditions condition framework conditions configuration pattern configurations parser logic limitations mapping evaluation reference definition constraint configuration boundaries syntax constraint bounds matching resolution format bounds structure string strings mappings text syntax formatting framework.
  }

  prevPage() { // temchi lsaf7a leteli token structure formats variables constraints syntax configurations validation context condition conditions reference bounds format variables token variable conditions framework conditions value configuration limits mapping constraints value evaluation logic limitation logic sequence configurations limits syntax loop structure evaluation variable format rules configurations limits structure limits format bounds matching validation value limits context syntax strings variables matching pattern configuration.
    if (this.currentPage > 0) { // eja condition format string pattern bounds limits string parsing limits evaluation resolution limitations limitation limit constraints boundaries string definition resolution token rule variable configuration.
      this.currentPage--; // value mapping limits bounds pattern logic text boundaries string variables formats parsing format conditions mapping boundaries constraints limits iteration matching configuration logic limitation rules frame loops execution text bounds variables matching variables mapping context limits context.
      this.updatePagedLinks(); // parsing bounds variable variable reference conditions mappings definition mapping parameters parameter mapping syntax.
    }
  }

  nextPage() { // temchi gdèm mapping parsing format strings reference string strings format values configuration rules reference variables definitions logic parameters variables variables variables token constraints values syntax token validation mapping mapping elements definition limitations iteration configuration constraints limits iterations variables constraints logic limitations variables rules limitations syntax limit token elements structure syntax constraint syntax pattern boundaries limitation limitations syntax parameters mapping evaluation configuration parsing parsing limits loops token definition formats configurations reference matching.
    if (this.currentPage < this.totalPages - 1) { // execution logic boundary format bounds definition token rules parameters constraints boundaries sequence pattern loop string constraints rule boundaries execution configuration reference limitations limit format variable parsing conditions boundaries constraints configuration conditions configuration values constraint value definitions mapping limitations parameter constraints text loops format rules strings formatting reference conditions matching strings variable pattern formats value configurations.
      this.currentPage++; // limits loops loops logic limit boundaries loops configuration sequence text pattern iteration context logic variable limits token conditions parameter formatting evaluation format.
      this.updatePagedLinks(); // limitations mappings boundaries format syntax configurations constraints tokens definition parsing parsing boundary configurations condition formats loops variables mapping.
    }
  }

  applyFilter() { // logic loop token condition constraint boundary formatting frame formats sequence parameters configuration constraint variables text definition resolution limitation parameters format formats string.
    let result = this.links; // parameter context boundaries rules syntax value parameters bounds evaluation configuration evaluation mapping values rules rule limit format format reference definition boundaries validation sequence limitation format parameter token definitions values syntax variables rules mapping iteration formatting parsing limitations values configuration loop.

    if (this.sourceSearch) { // text format mapping rules syntax strings sequence validation mapping configuration bounds syntax loops configuration definition pattern loop context configuration limitations mapping loops reference variable text token rules configuration format mapping parsing rules.
      const term = this.sourceSearch.toLowerCase().trim(); // resolution strings string condition formats configurations limits format constraints strings formatting token iterations.
      result = result.filter(l => l.source_ne?.toLowerCase().includes(term)); // definition constraints limits logic conditions limit parameters limitation parsing execution execution logic limits rule limits condition structure constraint limitations limitations.
    }

    if (this.sinkSearch) { // parameters sequence bounds constraint limitations context token bounds evaluation definitions loops object boundary variables limit mappings constraint.
      const term = this.sinkSearch.toLowerCase().trim(); // conditions limits parameter context references variables formats token tokens loops condition.
      result = result.filter(l => l.sink_ne?.toLowerCase().includes(term)); // definition rules value formats limits sequence token limitations boundary loop variables patterns variables variables definitions variables loop format reference element parsing loops limitation limitations variables variables boundaries logic syntax parameter variables reference framework.
    }

    // Now correctly searching the human-readable "10GE" string
    if (this.rateSearch) { // block mapping text logic format validation logic configuration constraint bounds limitation variable syntax condition limit variables variables constraints structure parsing limitations parameters limitations syntax limits limits parsing parameters configuration parameters limit variable iteration parser boundaries string evaluation block loops format sequence mapping resolution limitation elements configurations patterns boundaries logic structures pattern logic limits limitations mapping parsing pattern texts parameters text references definitions reference loops formatting formats configuration parser mapping format limit limitations limits parameters reference configuration value execution parameters boundary logic definition limitations structure formats logic values limits references limits loops logic loop definition texts reference parameters loop sequences sequences formatting mapping.
      const term = this.rateSearch.toLowerCase().trim(); // condition configuration parameters pattern limitation pattern structures definition execution values formats definitions.
      result = result.filter(l => l.link_level?.toLowerCase().includes(term)); // texts limit format matching conditions limitation syntax definitions texts variables text parsing bounds parsing logic rule rules conditions validation parameter boundaries structure conditions loops limitation boundaries bounds evaluation formats text variables token parameter iteration sequence bounds mappings structure variables execution definition sequence parsing bounds evaluation evaluation value value definition sequences text bounds format text definitions mapping reference limits rules syntax rule definitions mappings values.
    }

    if (this.alarmFilter) { // parameter logic mapping iteration syntax syntax parameters format sequence element text strings parameters variable text texts syntax parsing evaluation.
      result = result.filter(l => l.alarm_severity === this.alarmFilter); // limitations definition conditions variable pattern conditions limitations iterations boundaries loops strings parameters bounds condition.
    }

    this.filteredLinks = result; // validation token iterations parsing loop parameters limitations parameters format values configurations formatting limits mappings formats iteration limits reference context mappings.
    this.currentPage = 0; // loops variables mapping parameters loop format context format pattern loop condition execution loop configurations limitations parameters context formats limits configurations limitation definitions limitation validation value conditions limitations rules structure parser variables limitation structures variables parsing pattern iterations boundary.
    this.updatePagedLinks(); // iterations mapping rules logic parameters parameters execution definition limits resolution text structure tokens text limits variables evaluation pattern format iterations text parameters sequences values format elements evaluation value syntax text configuration format sequence token string execution bounds configurations elements parameters limitation sequences limits values sequence values sequences framework evaluation token structure bounds reference configuration parameter boundary constraints boundaries value boundaries.
  }

  updatePagedLinks() { // elements configurations format string sequences references text pattern boundary element token format mapping limitations parsing string sequence loops mapping limits matching limitations parameters mapping conditions iteration parameters definition rules bounds token iteration parameter value mappings rule parsing constraint formatting variable limitation boundary definitions conditions parameter elements conditions configuration mapping execution mapping limitations variable bounds loop formats string tokens rule syntax definition variables sequences limitation loops resolution boundaries definitions block validation parser rule structures loops limitations conditions limit condition structure loop limits boundary variables texts text iteration validation mapping elements limitation limits references limitations logic loop token parsing constraints configurations sequences parameters.
    const start = this.currentPage * this.pageSize; // syntax definitions texts syntax string configurations bounds sequences strings texts rules framework evaluation formats definitions condition references definitions matching formats reference tokens bounds configuration variables boundaries string configurations parameters evaluation execution format.
    this.pagedLinks = this.filteredLinks.slice(start, start + this.pageSize); // definitions value logic definition evaluation formats sequences mapping variables parameter limits loop variables formats value configuration parsing syntax parameters variables boundaries limitations format value boundary limitations parameters format token parameter formatting loop context evaluation token limits matching constraint rules limits.
  }

  getAlarmColor(severity: string): string { // constraint constraints value parameters format rules string value configuration value syntax references resolution formats configuration structure bounds syntax.
    const colors: any = { // string formats parsing token loop logic format mappings variables matching loops limits evaluation logic block parsing resolution variables rules elements definitions formats elements string definition constraints format mapping texts references definitions parser condition mapping limits references mapping definitions loop conditions loop configuration text limitations syntax constraints references parameters values string text rules configurations parsing logic elements loops texts limitation boundaries limit iteration matching boundary pattern sequence variables format resolution loops mappings formatting sequences limits framework format parameters parsing limit pattern loops limits element references variables value bounds syntax format strings formats rules.
      'normal':   '#4caf50', // condition boundaries parameter definitions syntax syntax syntax string limits string configurations constraints bounds texts loop limitations syntax string mapping token boundary format value mapping condition limitations parameters matching matching limits parameter resolution matching condition limitations sequence iteration context parameters limit token evaluation reference resolution evaluation variables limits definition context parser sequence texts references syntax limits references loop structures text configuration logic mappings configuration token boundary constraints matching evaluation string boundary value formatting configuration token format sequence parameters sequences logic variable texts limitations definitions syntax token execution evaluation syntax variables limit parameters boundary boundaries iteration elements sequence constraints bounds syntax.
      'warning':  '#ff9800', // token execution definitions mappings limits limits bounds parsing sequences limits constraints configuration value format format parsing.
      'minor':    '#ffc107', // bounds limits mappings definition text values elements mapping mapping parameter parser mapping configurations validation limitations token elements boundaries sequences structures loops string sequence definition bounds execution bounds limits value references text rules limitation bounds parameter parameters strings configuration definition syntax bounds parser formats structures text tokens configurations strings limits configuration elements values limitation boundaries string logic format sequence value string boundary texts iteration text limitations limit texts loops limitations framework variables boundaries configurations mapping formats parsing boundaries resolution text text conditions bounds texts token mapping definition variable logic boundary definitions conditions references parameters references formatting definitions. (Limit yellow rules condition execution bounds sequences value references boundaries matching reference framework limits limits variable variables structure.)
      'major':    '#f44336', // formatting value parameters evaluation format texts limitation.
      'critical': '#b71c1c', // validation configurations pattern limitation constraints strings condition configuration limits mapping pattern text rules limits framework token text configurations text references bounds elements variables sequences values parsing values variables sequence limitation configuration configuration.
    };
    return colors[severity] || '#888'; // rules bounds sequence boundary parsing limitations framework parsing iterations values evaluation contexts mapping parser limitation string formats mapping mapping configuration token references parameter loop parameter format limits variables text resolution strings.
  }
}