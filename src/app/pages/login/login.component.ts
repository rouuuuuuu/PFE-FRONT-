import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  resetRequestForm: FormGroup;   // Step 1 — enter email
  resetConfirmForm: FormGroup;   // Step 2 — enter code + new password

  /** 'login' | 'reset-request' | 'reset-confirm' */
  mode: 'login' | 'reset-request' | 'reset-confirm' = 'login';

  loading = false;
  error = '';
  resetMessage = '';
  showPassword = false;
  showNewPassword = false;

  isDarkMode = true;
  currentLang = 'en';
  cursorX = -200;
  cursorY = -200;
  private isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.resetRequestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetConfirmForm = this.fb.group({
      email:        ['', [Validators.required, Validators.email]],
      code:         ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem('noc-theme');
      if (savedTheme === 'light') {
        this.isDarkMode = false;
        document.body.classList.add('light-theme');
      }
      this.currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
    }
  }

  // ── Login ────────────────────────────────────────────────────
  onLogin() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        // Extract Django error message if present
        this.error = err?.error?.error || err?.error?.detail || 'Invalid email or password';
      }
    });
  }

  // ── Reset Step 1: request code ───────────────────────────────
  onRequestReset() {
    if (this.resetRequestForm.invalid) return;
    this.loading = true;
    this.error = '';
    this.resetMessage = '';

    const email = this.resetRequestForm.value.email;
    this.authService.resetPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.resetMessage = 'LOGIN.RESET_CODE_SENT';
        // Pre-fill email in confirm form and move to step 2
        this.resetConfirmForm.patchValue({ email });
        setTimeout(() => { this.mode = 'reset-confirm'; this.resetMessage = ''; }, 1800);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || err?.error?.detail || 'Failed to send reset request';
      }
    });
  }

  // ── Reset Step 2: confirm code + new password ────────────────
  onConfirmReset() {
    if (this.resetConfirmForm.invalid) return;
    this.loading = true;
    this.error = '';
    this.resetMessage = '';

    this.authService.confirmResetPassword(this.resetConfirmForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.resetMessage = 'LOGIN.RESET_SUCCESS_CONFIRM';
        setTimeout(() => { this.mode = 'login'; this.resetMessage = ''; }, 2200);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || err?.error?.detail || 'Reset failed. Check your code and try again.';
      }
    });
  }

  // ── UI helpers ───────────────────────────────────────────────
  switchMode(m: 'login' | 'reset-request' | 'reset-confirm') {
    this.mode = m;
    this.error = '';
    this.resetMessage = '';
  }

  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'fr' : 'en';
    this.translate.use(this.currentLang);
  }

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

  onMouseMove(event: MouseEvent) {
    this.cursorX = event.clientX;
    this.cursorY = event.clientY;
  }
}
