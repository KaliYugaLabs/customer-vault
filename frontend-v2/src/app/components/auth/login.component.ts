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
  selector: 'app-login',
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
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-subtitle>Sign in to manage your customers</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     formControlName="email"
                     placeholder="Enter your email">
              <mat-icon matSuffix>email</mat-icon>
              @if (loginForm.get('email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email')) {
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
              @if (loginForm.get('password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
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
                    [disabled]="loginForm.invalid || isLoading">
              @if (isLoading) {
                <mat-spinner diameter="20" class="spinner"></mat-spinner>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
              }
            </button>
          </form>
        </mat-card-content>
        
        <mat-card-actions>
          <p class="signup-text">
            Don't have an account? 
            <a routerLink="/register" class="signup-link">Sign up</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
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
    
    .signup-text {
      margin: 0;
      color: #666;
    }
    
    .signup-link {
      color: #673ab7;
      text-decoration: none;
      font-weight: 500;
    }
    
    .signup-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  
  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password);
      this.router.navigate(['/customers']);
      this.snackBar.open('Welcome back!', 'Close', { duration: 3000 });
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed';
    } finally {
      this.isLoading = false;
    }
  }
}
