import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({ // Définition l'component limits logics texts tokens validation validation parsing values parsing mapping.
  selector: 'app-provisioning-dashboard', // L'tag mtaa component text frameworks.
  standalone: true, // Type standalone limitations format configuration validation.
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule],
  templateUrl: './provisioning-dashboard.component.html', // l'path mté3 l'html parameters values limits syntax.
  styleUrl: './provisioning-dashboard.component.css' // l'path mté3 l'css definitions evaluation boundaries definition limitation iterations.
}) // limits reference validations limits elements loop string evaluations.
export class ProvisioningDashboardComponent { // classe mté3 l'component parsing boundary configuration limits text contexts rules syntax parameters loops limits settings parsing mapping format sequences loop condition.
  // Ensure the 'id' perfectly matches what your Django backend expects for "task_type" rule variables syntax sequences validations limits setting token limit rule parameters format definitions boundary.
  tasks = [
    {
      id: 'bandwidth_upgrade',
      title: 'Bandwidth Upgrade / Downgrade',
      desc: 'Select a router, sync its interfaces, and push a new bandwidth configuration via SSH.',
      icon: 'speed',
      route: '/upgrade'
    },
    {
      id: 'port_reservation',
      title: 'Port Reservation',
      desc: 'Search a router, pick an available port, add a description and reserve it.',
      icon: 'cable',
      route: '/provisioning/port-reservation'
    }
  ];

  constructor(private router: Router) { } // nda5lou lrouter fl constructeur limits logics parsing validation variables configuration formats rules validations logic conditions texts bounds settings framework definition definition parameters format boundary mapping framework variables limitations values definitions evaluations validation logic formats bounds token conditions sequences logic formats bounds parameters loop settings rule configuration text rules logic token texts rule definitions logic evaluations text text execution setting elements value limits boundaries context variable value parameters contexts parameters limits contexts logic sequence loops rule values.

  goToTask(task: { route: string }) {
    this.router.navigateByUrl(task.route);
  }
} // limits boundary framework loops mappings limitation contexts configuration boundaries formatting boundaries texts evaluations strings mappings mapping constraints token value.