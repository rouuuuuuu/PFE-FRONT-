import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminRequestsComponent } from '../../ai-engine/admin-requests/admin-requests.component';
import { AccessRequestComponent } from '../../ai-engine/access-request/access-request.component';
import { UserManagementComponent } from '../user-management/user-management.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegisterComponent } from '../register/register.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreferencesService } from '../../services/preferences.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../services/notification.service';
import { HttpClient } from '@angular/common/http';

// Custom validator for matching passwords
export function passwordsMatchValidator(group: FormGroup) {
  const newPass = group.get('new_password')?.value;
  const confirmPass = group.get('confirm_password')?.value;
  return newPass === confirmPass ? null : { mismatch: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    AdminRequestsComponent, 
    AccessRequestComponent,
    RegisterComponent,
    UserManagementComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  activeTab = 'account';
  user$ = this.authService.currentUser$;

  editProfileForm: FormGroup;
  passwordForm: FormGroup;
  isEditing = false;
  isChangingPassword = false;

  constructor(
    public authService: AuthService, 
    private fb: FormBuilder,
    public prefService: PreferencesService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    public notificationService: NotificationService,
    private http: HttpClient
  ) {
    this.editProfileForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      display_name: ['']
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required]
    }, { validators: passwordsMatchValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.editProfileForm.patchValue({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          display_name: user.display_name || ''
        });
      } else {
        this.authService.loadCurrentUser().subscribe();
      }
    });

    // Auto mark notifications as read when profile opens
    this.http.post('http://127.0.0.1:8000/api/auth/notifications/mark-read/', {})
      .subscribe(() => {
        if (this.notificationService.fetchCount) {
          this.notificationService.fetchCount();
        }
      });
  }

  updateProfile() {
    this.authService.updateProfile(this.editProfileForm.value).subscribe({
      next: () => {
        this.isEditing = false;
        this.snackBar.open(this.translate.instant('PROFILE.UPDATE_SUCCESS') || 'Profile updated successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
      },
      error: (err) => {
        const errorMsg = err.error?.detail || this.translate.instant('PROFILE.UPDATE_ERROR') || 'Error updating profile';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    const payload = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password,
      confirm_password: this.passwordForm.value.confirm_password
    };
    
    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.snackBar.open(this.translate.instant('PROFILE.PASSWORD_SUCCESS') || 'Password changed successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.passwordForm.reset();
      },
      error: (err) => {
        const errorMsg = err.error?.detail || this.translate.instant('PROFILE.PASSWORD_ERROR') || 'Error changing password';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }
}
