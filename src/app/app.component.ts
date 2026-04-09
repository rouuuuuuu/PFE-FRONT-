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
  template: `
    <mat-toolbar color="primary" style="background:#E87722">
      <span>Orange Tunisie NOC</span>
    </mat-toolbar>

    <mat-sidenav-container style="height: calc(100vh - 64px)">
      <mat-sidenav mode="side" opened style="width:250px; padding:16px">
        <mat-nav-list>
          <a mat-list-item routerLink="/" routerLinkActive="active-link"
             [routerLinkActiveOptions]="{exact:true}">
            📊 Dashboard
          </a>
          <a mat-list-item routerLink="/routers" routerLinkActive="active-link">
            🖥️ Routers
          </a>
          <a mat-list-item routerLink="/switches" routerLinkActive="active-link">
            🕹️ Switches
          </a>
          <a mat-list-item routerLink="/links" routerLinkActive="active-link">
            🔗 Backhaul Links
          </a>
          
          <mat-list-item (click)="toggleProvisioning()" style="cursor: pointer;"> 
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <span>⚙️ Provisioning</span>
              <span>{{ isProvisioningOpen ? '▼' : '▶' }}</span>
            </div>
          </mat-list-item>

          <ng-container *ngIf="isProvisioningOpen">
            <a mat-list-item routerLink="/provisioning" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:true}" style="padding-left: 40px; font-size: 14px;">
              📁 All Tasks 
            </a>
            <a mat-list-item routerLink="/provisioning/task/configure_vlan" routerLinkActive="active-link" style="padding-left: 40px; font-size: 14px;">
              🔌task1
            </a>
            <a mat-list-item routerLink="/provisioning/task/firmware_upgrade" routerLinkActive="active-link" style="padding-left: 40px; font-size: 14px;">
              🔄 task2
            </a>
            <a mat-list-item routerLink="/provisioning/task/push_acl" routerLinkActive="active-link" style="padding-left: 40px; font-size: 14px;">
              📡 task3
            </a>
          </ng-container>

        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content style="padding:24px">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    /* Using background modification so the text color doesn't clash with emojis */
    .active-link { background: rgba(232, 119, 34, 0.1); color: #E87722 !important; font-weight: bold; border-right: 4px solid #E87722; }
  `]
})
export class AppComponent {
  // State variable to control the dropdown
  isProvisioningOpen = false;

  // Toggle function
  toggleProvisioning() {
    this.isProvisioningOpen = !this.isProvisioningOpen;
  }
}