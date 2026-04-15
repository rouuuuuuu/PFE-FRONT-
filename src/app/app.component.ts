import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule,
    MatListModule, MatIconModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  // State variable to control the dropdown
  isProvisioningOpen = false;

  // Theme state
  isDarkMode = true;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Load saved theme preference from localStorage
      const savedTheme = localStorage.getItem('noc-theme');
      if (savedTheme === 'light') {
        this.isDarkMode = false;
        document.body.classList.add('light-theme');
      }
    }
  }

  // Toggle function
  toggleProvisioning() {
    this.isProvisioningOpen = !this.isProvisioningOpen;
  }

  // Theme toggle
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isBrowser) {
      if (this.isDarkMode) {
        document.body.classList.remove('light-theme');
        localStorage.setItem('noc-theme', 'dark');
      } else {
        document.body.classList.add('light-theme');
        localStorage.setItem('noc-theme', 'light');
      }
    }
  }
}