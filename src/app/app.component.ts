import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Added for *ngIf
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, // Required for *ngIf
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule,
    MatListModule, MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // State variable to control the dropdown
  isProvisioningOpen = false;

  // Toggle function
  toggleProvisioning() {
    this.isProvisioningOpen = !this.isProvisioningOpen;
  }
}