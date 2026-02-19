import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Sign up to start managing customers</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput 
                     type="text" 
                     formControlName="displayName"
                     placeholder="Enter your full name">
              <mat-icon matSuffix>person</mat-icon>
              @if (registerForm.get('displayName')?.hasError('required')) {
                <mat-error>Name is required</mat-error>
              }
              @if (registerForm.get('displayName')?.hasError('minlength')) {
                <mat-error>Name must be at least 2 characters</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     formControlName="email"
                     placeholder="Enter your email">
              <mat-icon matSuffix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email')) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput 
                     [type]="hidePassword ? 'password' : 'text'"
                     formControlName="password"
                     placeholder="Enter your password">
              <button mat-icon-button 
                      matSuffix 
                      type="button"
                      (click)="hidePassword = !hidePassword"
                      [attr.aria-label]="'Hide password'">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength')) {
                <mat-error>Password must be at least 6 characters</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput 
                     [type]="hideConfirmPassword ? 'password' : 'text'"
                     formControlName="confirmPassword"
                     placeholder="Confirm your password">
              <button mat-icon-button 
                      matSuffix 
                      type="button"
                      (click)="hideConfirmPassword = !hideConfirmPassword"
                      [attr.aria-label]="'Hide password'">
                <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('confirmPassword')?.hasError('required')) {
                <mat-error>Please confirm your password</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch')) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            
            @if (errorMessage) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            }
            
            <button mat-raised-button 
                    color="primary" 
                    type="submit"
                    class="full-width"
                    [disabled]="registerForm.invalid || isLoading">
              @if (isLoading) {
                <mat-spinner diameter="20" class="spinner"></mat-spinner>
                <span>Creating account...</span>
              } @else {
                <span>Create Account</span>
              }
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <p class="login-text">
            Already have an account? 
            <a routerLink="/login" class="login-link">Sign in</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .register-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }
    
    mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    mat-card-title {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin-bottom: 16px;
      padding: 12px;
      background-color: #ffebee;
      border-radius: 4px;
    }
    
    button[type="submit"] {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .spinner {
      display: inline-block;
    }
    
    mat-card-actions {
      text-align: center;
      padding: 16px;
    }
    
    .login-text {
      margin: 0;
      color: #666;
    }
    
    .login-link {
      color: #673ab7;
      text-decoration: none;
      font-weight: 500;
    }
    
    .login-link:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  registerForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });
  
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage = '';
  
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }
  
  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const { email, password, displayName } = this.registerForm.value;
      await this.authService.register(email, password, displayName);
      this.router.navigate(['/customers']);
      this.snackBar.open('Account created successfully!', 'Close', { duration: 3000 });
    } catch (error: any) {
      this.errorMessage = error.message || 'Registration failed';
    } finally {
      this.isLoading = false;
    }
  }
}
