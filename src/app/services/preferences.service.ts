import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private isBrowser: boolean;

  isDarkMode$ = new BehaviorSubject<boolean>(true);
  currentLang$ = new BehaviorSubject<string>('en');
  accentColor$ = new BehaviorSubject<string>('#FF7900');

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private translate: TranslateService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initPreferences();
  }

  private initPreferences() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('noc-theme');
      if (savedTheme === 'light') {
        this.isDarkMode$.next(false);
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }

      const savedLang = localStorage.getItem('noc-lang') || 'en';
      this.currentLang$.next(savedLang);
      this.translate.setDefaultLang('en');
      this.translate.use(savedLang);

      const savedColor = localStorage.getItem('noc-color') || '#FF7900';
      this.setAccentColor(savedColor);
    }
  }

  toggleTheme() {
    if (!this.isBrowser) return;
    const isDark = !this.isDarkMode$.value;
    this.isDarkMode$.next(isDark);
    if (isDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('noc-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('noc-theme', 'light');
    }
  }

  setTheme(isDark: boolean) {
    if (!this.isBrowser) return;
    this.isDarkMode$.next(isDark);
    if (isDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('noc-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('noc-theme', 'light');
    }
  }

  setLanguage(lang: string) {
    if (!this.isBrowser) return;
    this.currentLang$.next(lang);
    this.translate.use(lang);
    localStorage.setItem('noc-lang', lang);
  }

  toggleLanguage() {
    if (!this.isBrowser) return;
    const newLang = this.currentLang$.value === 'en' ? 'fr' : 'en';
    this.currentLang$.next(newLang);
    this.translate.use(newLang);
    localStorage.setItem('noc-lang', newLang);
  }

  setAccentColor(color: string) {
    if (!this.isBrowser) return;
    this.accentColor$.next(color);
    document.documentElement.style.setProperty('--primary-orange', color);
    localStorage.setItem('noc-color', color);
  }
}
