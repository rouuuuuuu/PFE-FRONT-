import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

interface UserPrefs {
  theme: 'dark' | 'light';
  lang: string;
  color: string;
}

const DEFAULTS: UserPrefs = { theme: 'dark', lang: 'en', color: '#FF7900' };

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private isBrowser: boolean;
  private currentUsername: string | null = null;

  isDarkMode$ = new BehaviorSubject<boolean>(true);
  currentLang$ = new BehaviorSubject<string>('en');
  accentColor$ = new BehaviorSubject<string>('#FF7900');

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private translate: TranslateService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Apply defaults on boot (login page uses these)
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  // ── Called after login / page refresh when user is known ──────────────
  loadForUser(username: string): void {
    if (!this.isBrowser) return;
    this.currentUsername = username;
    const prefs = this.readPrefs(username);
    this.applyTheme(prefs.theme === 'dark');
    this.applyLang(prefs.lang);
    this.applyColor(prefs.color);
  }

  // ── Called on logout — reset UI to defaults ──────────────────────────
  resetToDefaults(): void {
    this.currentUsername = null;
    this.applyTheme(true);
    this.applyLang('en');
    this.applyColor('#FF7900');
  }

  // ── Public actions (save per-user) ──────────────────────────────────

  toggleTheme(): void {
    if (!this.isBrowser) return;
    const isDark = !this.isDarkMode$.value;
    this.applyTheme(isDark);
    this.saveField('theme', isDark ? 'dark' : 'light');
  }

  setTheme(isDark: boolean): void {
    if (!this.isBrowser) return;
    this.applyTheme(isDark);
    this.saveField('theme', isDark ? 'dark' : 'light');
  }

  setLanguage(lang: string): void {
    if (!this.isBrowser) return;
    this.applyLang(lang);
    this.saveField('lang', lang);
  }

  toggleLanguage(): void {
    if (!this.isBrowser) return;
    const newLang = this.currentLang$.value === 'en' ? 'fr' : 'en';
    this.applyLang(newLang);
    this.saveField('lang', newLang);
  }

  setAccentColor(color: string): void {
    if (!this.isBrowser) return;
    this.applyColor(color);
    this.saveField('color', color);
  }

  // ── Internal: apply to UI without saving ────────────────────────────

  private applyTheme(isDark: boolean): void {
    this.isDarkMode$.next(isDark);
    if (this.isBrowser) {
      if (isDark) {
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
      }
    }
  }

  private applyLang(lang: string): void {
    this.currentLang$.next(lang);
    this.translate.use(lang);
  }

  private applyColor(color: string): void {
    this.accentColor$.next(color);
    if (this.isBrowser) {
      document.documentElement.style.setProperty('--primary-orange', color);
    }
  }

  // ── localStorage helpers — per-user key ─────────────────────────────

  private storageKey(username: string): string {
    return `noc-prefs-${username}`;
  }

  private readPrefs(username: string): UserPrefs {
    try {
      const raw = localStorage.getItem(this.storageKey(username));
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULTS, ...parsed };
      }
    } catch { /* ignore corrupt data */ }

    // Migrate old global keys for the first user who logs in after the update
    const legacyTheme = localStorage.getItem('noc-theme');
    const legacyLang = localStorage.getItem('noc-lang');
    const legacyColor = localStorage.getItem('noc-color');
    if (legacyTheme || legacyLang || legacyColor) {
      const migrated: UserPrefs = {
        theme: legacyTheme === 'light' ? 'light' : 'dark',
        lang: legacyLang || 'en',
        color: legacyColor || '#FF7900'
      };
      localStorage.setItem(this.storageKey(username), JSON.stringify(migrated));
      // Clean up old keys
      localStorage.removeItem('noc-theme');
      localStorage.removeItem('noc-lang');
      localStorage.removeItem('noc-color');
      return migrated;
    }

    return { ...DEFAULTS };
  }

  private saveField(field: keyof UserPrefs, value: string): void {
    if (!this.currentUsername || !this.isBrowser) return;
    const prefs = this.readPrefs(this.currentUsername);
    (prefs as any)[field] = value;
    localStorage.setItem(this.storageKey(this.currentUsername), JSON.stringify(prefs));
  }
}
