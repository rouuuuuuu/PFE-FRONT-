import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  dataSource: MatTableDataSource<CurrentUser> = new MatTableDataSource();
  displayedColumns: string[] = ['username', 'email', 'role', 'status', 'dateJoined', 'aiAccess', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  protected readonly Math = Math;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (response: any) => {
        let usersData = [];
        if (response && Array.isArray(response.results)) {
          usersData = response.results;
        } else if (Array.isArray(response)) {
          usersData = response;
        } else {
          this.snackBar.open('Unexpected data format received', 'Close', { duration: 3000 });
        }
        this.dataSource.data = usersData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.snackBar.open('Failed to load users: ' + (err.error?.detail || err.message || 'Unknown error'), 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  toggleStatus(user: CurrentUser, event: any) {
    const isActive = event.checked;
    this.authService.toggleUserActive(user.id, isActive).subscribe({
      next: () => {
        user.is_active = isActive;
        this.snackBar.open(`User status updated to ${isActive ? 'Active' : 'Inactive'}`, 'Close', { duration: 3000 });
      },
      error: () => {
        event.source.checked = !isActive;
        this.snackBar.open('Failed to update user status', 'Close', { duration: 3000 });
      }
    });
  }

  openEditCredentialsDialog(user: CurrentUser) {
    const dialogRef = this.dialog.open(EditCredentialsDialogComponent, {
      width: '400px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const data: any = {
          username: result.username,
          email: result.email
        };
        if (result.password) {
          data.password = result.password;
        }

        this.authService.updateUserCredentials(user.id, data).subscribe({
          next: () => {
            this.snackBar.open('Credentials updated', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadUsers();
          },
          error: (err) => {
            this.snackBar.open(err.error?.detail || 'Failed to update credentials', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
          }
        });
      }
    });
  }

  openResetPasswordDialog(user: CurrentUser) {
    const dialogRef = this.dialog.open(PasswordResetDialogComponent, {
      width: '400px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(newPassword => {
      if (newPassword) {
        this.authService.forceResetPassword(user.id, newPassword).subscribe({
          next: () => this.snackBar.open('Password reset successful', 'Close', { duration: 3000, panelClass: ['success-snackbar'] }),
          error: (err) => this.snackBar.open(err.error?.detail || 'Failed to reset password', 'Close', { duration: 5000, panelClass: ['error-snackbar'] })
        });
      }
    });
  }
}

@Component({
  selector: 'app-edit-credentials-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Credentials</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width: 100%; margin-top: 8px;">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username">
          <mat-error *ngIf="form.get('username')?.hasError('required')">Username is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>New Password (Optional)</mat-label>
          <input matInput type="password" formControlName="password" placeholder="Leave blank to keep current">
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">Minimum 8 characters</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `
})
export class EditCredentialsDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditCredentialsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: CurrentUser },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      username: [data.user.username, Validators.required],
      email: [data.user.email, [Validators.required, Validators.email]],
      password: ['', Validators.minLength(8)]
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}

@Component({
  selector: 'app-password-reset-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Reset Password</h2>
    <mat-dialog-content>
      <p>Reset password for <strong>{{ data.user.username }}</strong></p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>New Password</mat-label>
          <input matInput type="password" formControlName="new_password">
          <mat-error *ngIf="form.get('new_password')?.hasError('required')">Password is required</mat-error>
          <mat-error *ngIf="form.get('new_password')?.hasError('minlength')">Minimum 8 characters</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Reset</button>
    </mat-dialog-actions>
  `
})
export class PasswordResetDialogComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PasswordResetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: CurrentUser },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.new_password);
    }
  }
}
