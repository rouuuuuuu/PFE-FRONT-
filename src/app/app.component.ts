import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule,
    MatListModule, MatIconModule,
  ],
  template: `
    <mat-toolbar color="primary" style="background:#E87722">
      <span>Orange Tunisie NOC</span>
    </mat-toolbar>

    <mat-sidenav-container style="height: calc(100vh - 64px)">
      <mat-sidenav mode="side" opened style="width:220px; padding:16px">
        <mat-nav-list>
          <a mat-list-item routerLink="/" routerLinkActive="active-link"
             [routerLinkActiveOptions]="{exact:true}">
            📊 Dashboard
          </a>
          <a mat-list-item routerLink="/routers" routerLinkActive="active-link">
            🖥️ Routers
          </a>
          <a mat-list-item routerLink="/links" routerLinkActive="active-link">
            🔗 Backhaul Links
          </a>
          <a mat-list-item routerLink="/provisioning" routerLinkActive="active-link">   
            ⚙️ Provisioning
         </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content style="padding:24px">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .active-link { background: #cbaf7b; color: #E87722; font-weight: bold; }
  `]
})
export class AppComponent {}