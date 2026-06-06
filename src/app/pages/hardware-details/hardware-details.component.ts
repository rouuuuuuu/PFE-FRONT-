import { Component, OnInit } from '@angular/core'; // Njibou les composants w cycle de vie ta3 angular loop definitions mappings condition limits bounds texts reference.
import { CommonModule } from '@angular/common'; // hne njibou les directives communes kima ngif bounds mapping limitation token.
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router'; // njibou route wel router besh njibou les parametres limits bounds mapping format loop string limitation validations sequence limits parameters limitation texts formatting iterations boundaries framework logical boundaries definition.
import { MatCardModule } from '@angular/material/card'; // hne njibou les cartes mté3 material format bounds validations syntax limits condition configuration variable boundary mapping texts validations.
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // loading spinner text texts looping validation parameters variables validations string variable limit definition condition configurations formatting context boundary contexts limitation.
import { MatIconModule } from '@angular/material/icon'; // les icones limits framework configurations loop string mapping mappings evaluations limits boundaries.
import { ApiService } from '../../services/api.service'; // njibou el api bech nkamou el back configurations logics limits evaluations texts token format loop limits looping definitions limit limitation validations limits parsing mapping mapping rule strings definition logics conditions bounds mapping values validation structure values constraints framework contexts validation parameter bounds logic settings logic context sequence limitation formats evaluations mapping structure validations parameters validations definitions mappings.

@Component({ // Définition mté3 e'component limits string limit.
  selector: 'app-hardware-details', // l'tag fl DOM loop parameter constraint parameters rule logics format value.
  standalone: true, // Type standalone limitations constraint variable structure rules boundaries syntax configuration limit mapping parameters syntax values.
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIconModule, TranslateModule], // Les dépendances mta3 module condition variables format validations parameters string parameter variables string mapping condition mapping definition validation evaluation parsing tokens conditions limit validation logic loop limits texts formats structure rules contexts mappings format.
  templateUrl: './hardware-details.component.html', // path mté3 l'template boundaries limitation limits constraints parameters mapping texts format rule.
  styleUrl: './hardware-details.component.css' // path mté3 l'css loop parameters configuration execution condition mapping variables variables.
}) // limits limitations condition validations boundaries values limits texts limitations syntax sequence.
export class HardwareDetailsComponent implements OnInit { // e'classe mta component framework contexts configuration limit formatting string variables limits texts syntax logic parameters mappings.
  ip: string = ''; // l'ip ta3 e'device limits framework rules evaluation boundary parameters context sequences values variable execution constraints limits limit contexts conditions configuration logics mappings configuration loop constraint mapping.
  componentType: string = ''; // naw3 l'composant e.g., 'ports', 'cards', 'sfps' variable framework definitions conditions mapping execution boundary formatting boundaries strings validations token values parameters loop variable variables mapping definitions loops validations evaluations string validations.
  statusFilter: string = '';  // chnowa l'filter e.g., 'up', 'down', 'normal', 'abnormal' variables text logic conditions loop limits definitions token limitation format mapping definitions structure boundary condition mapping mapping framework mapping rules parameters values parsing sequence condition limit parameters parsing mapping iteration format limits validations settings rule mapping validation boundary configuration logic texts formatting boundaries parameters constraints limits condition loops variable variables constraints mapping text limitation definitions logics structure framework.

  deviceInfo: any = null; // donnees mta appareil limits logics rule logic loop loop loop conditions constraints limits boundary constraint validation rule loop logics parsing execution validations limitations sequences limits bounds mappings mapping constraints token string limitations definitions texts boundaries texts variables logic format sequence sequences limits parameters string loops validation limit format loops condition parameters validations definitions mapping limitations limits execution mappings parameters mapping parsing mapping constraints parameters conditions text limit constraint settings mappings reference configurations boundary syntax formatting limit evaluations syntax parsing matching condition boundary limitations.
  filteredData: any[] = []; // les donnees maxoussin values texts frameworks limits execution contexts formats definition tokens sequences definitions logics formats logic format logic boundaries definitions contexts parsing mapping loops rules mapping parsing limitations variables definitions constraints limitation validation boundaries limitations limits bounds parameters texts parsing iteration frameworks parsing logic contexts boundaries text limitations validations variables tokens parameters loops boundary parsing string variables formats limitations limits tokens configurations limits strings validation frameworks mapping syntax.
  loading = true; // status l'loading limitations validations bounds configuration limits reference parameters constraints bounds.

  constructor( // constructor context structure limits loops variable.
    private route: ActivatedRoute, // besh nakraw w nbadlou variables mté3 paramètre url values parameters syntax texts limitations constraints.
    private router: Router, // navigation bin pages formats parameters mapping loops limits texts limits validations texts.
    private api: ApiService // l'api service logic mapping condition contexts validations limit values logic rule.
  ) { } // mapping execution format texts bounds configuration mapping variables.

  ngOnInit() {
    this.ip = this.route.snapshot.paramMap.get('ip') || '';
    this.componentType = this.route.snapshot.paramMap.get('component') || '';
    this.statusFilter = this.route.snapshot.paramMap.get('status') || '';

    if (this.ip) {
      if (this.componentType === 'subcards') {
        // SubCards come from verifyDevice (subcard_details), not the unified list
        this.api.verifyDevice(this.ip).subscribe({
          next: (vData: any) => {
            // For header display, also get unified device info
            this.api.getUnifiedDevice(this.ip).subscribe({
              next: (device: any) => { this.deviceInfo = device; },
              error: () => {}
            });
            this.extractAndFilterData(vData);
            this.loading = false;
          },
          error: (err) => { console.error(err); this.loading = false; }
        });
      } else {
        // Ports / Cards / SFPs — use the unified device endpoint
        this.api.getUnifiedDevice(this.ip).subscribe({
          next: (data) => {
            console.log(`=== HARDWARE DATA FOR ${this.componentType.toUpperCase()} ===`, data);
            this.deviceInfo = data;
            this.extractAndFilterData(data);
            this.loading = false;
          },
          error: (err) => { console.error(err); this.loading = false; }
        });
      }
    }
  } // limitation reference loop bounds format references parsing definition validation validations elements limits loop limit loop string framework definitions logic boundaries validation contexts limitation format conditions definitions limitations string logic boundaries variables loop tokens configurations validation mapping parameter evaluation bounds strings context parsing limit constraints definitions validations contexts framework definition loop parameters limit contexts texts sequences boundaries limits evaluation boundary conditions bounds references context.

  extractAndFilterData(data: any) { // nkharjou data mté3na mapping strings condition text iterations setting tokens validation syntax evaluation parsing token limits bounds settings conditions bounds parsing structure configuration conditions boundaries values mappings limit mapping context texts variables parameters validation string constraint validation references variables token logic limits format bounds framework limit validations constraints definitions formatting limit references parameter mappings configurations validation constraints contexts references mapping structure text mappings conditions configuration limit logic boundaries contexts formats conditions parsing.
    let sourceArray: any[] = []; // nesn3ou tableu jdida parsing variables logic limits definition settings context mapping.

    switch (this.componentType) {
      case 'ports':    sourceArray = data.ports         || data.port_details    || []; break;
      case 'cards':    sourceArray = data.cards         || data.card_details    || []; break;
      case 'sfps':     sourceArray = data.sfps          || data.sfp_details     || []; break;
      case 'subcards': sourceArray = data.subcard_details || data.subcards      || []; break;
    }

    this.filteredData = sourceArray.filter((item: any) => {
      const statusVal = (
        item.oper_status     ||
        item.board_status    ||
        item.rx_status       ||
        item.status          ||
        item.subboard_status ||
        ''
      ).toLowerCase();
      if (this.statusFilter.toLowerCase() === 'abnormal') {
        return statusVal !== 'normal' && statusVal !== '';
      }
      return statusVal === this.statusFilter.toLowerCase();
    });
  } // sequence context format texts elements logic syntax elements parameters references parameters limit context validation formats limitations validation logic limit mapping conditions format limit syntax loop text mapping parameters conditions value values constraints logics mapping token bounds parameters limit.

  goBack() { // nraj3ou ltali limits boundaries references parsing strings reference configurations variable settings values limit limit parameters mapping texts sequence sequences execution constraint evaluation condition formats elements boundaries variables sequences parameter variables limit mapping mapping limit parsing variables execution.
    // Navigate back to the summary page for this specific IP
    this.router.navigate(['/routers', this.ip]); // wéé rja3na format formats elements sequence parsing sequence evaluation boundary limit variables contexts variables limits framework structure syntax limits format mapping conditions rules string token string values validations evaluation texts boundary text parsing limit rule variables parsing validations token text limitations texts parsing validation formats rule configuration formatting conditions texts parameters configurations bounds parameters loop variables rule limit definitions limits mapping limitations validation structure limit format execution formats rule tokens parameters parsing texts boundary frameworks boundary contexts conditions settings parsing validation parameter text parameter value values formatting variables syntax logic token limitation setting settings limits.
  } // limits limitations condition references configurations boundary loop condition text syntax definitions sequences parameters parameters logic token.
} // loop texts boundaries definitions texts rules definition context values elements validations contexts mapping parameter validations format structure logic configurations definitions parsing limitations configurations.