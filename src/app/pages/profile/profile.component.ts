import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminRequestsComponent } from '../../ai-engine/admin-requests/admin-requests.component';
import { AccessRequestComponent } from '../../ai-engine/access-request/access-request.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegisterComponent } from '../register/register.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PreferencesService } from '../../services/preferences.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    TranslateModule, 
    AdminRequestsComponent, 
    AccessRequestComponent,
    RegisterComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
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
  profileMessage = '';
  passwordMessage = '';

  constructor(
    public authService: AuthService, 
    private fb: FormBuilder,
    public prefService: PreferencesService
  ) {
    this.editProfileForm = this.fb.group({
      first_name: [''],
      last_name: [''],
      display_name: ['']
    });

    this.passwordForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
  }

  updateProfile() {
    this.authService.updateProfile(this.editProfileForm.value).subscribe({
      next: () => {
        this.isEditing = false;
        this.profileMessage = 'Profile updated successfully!';
        setTimeout(() => this.profileMessage = '', 3000);
      },
      error: () => this.profileMessage = 'Failed to update profile.'
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordMessage = 'Password changed successfully!';
        this.passwordForm.reset();
        setTimeout(() => this.passwordMessage = '', 3000);
      },
      error: () => this.passwordMessage = 'Failed to change password.'
    });
  }
}
