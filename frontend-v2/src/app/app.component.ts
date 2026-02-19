import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LayoutComponent } from './components/layout/layout.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LayoutComponent,
    MatProgressBarModule
  ],
  template: `
    @if (authService.isLoading()) {
      <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
      <div class="loading-screen">
        <p>Loading...</p>
      </div>
    } @else if (authService.isAuthenticated()) {
      <app-layout>
        <router-outlet></router-outlet>
      </app-layout>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
    }
    
    .loading-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #666;
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
}
