import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="not-found-container">
      <mat-card class="not-found-card">
        <mat-icon class="not-found-icon">sentiment_dissatisfied</mat-icon>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <button mat-raised-button color="primary" routerLink="/">
          <mat-icon>home</mat-icon>
          Go Home
        </button>
      </mat-card>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .not-found-card {
      text-align: center;
      padding: 48px;
      max-width: 400px;
    }
    
    .not-found-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    h1 {
      font-size: 80px;
      font-weight: 700;
      margin: 0;
      color: #673ab7;
      line-height: 1;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 500;
      margin: 16px 0;
      color: #333;
    }
    
    p {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    
    button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class NotFoundComponent {}
