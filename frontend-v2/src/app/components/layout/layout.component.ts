import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav 
        #drawer 
        class="sidenav" 
        fixedInViewport
        [attr.role]="'navigation'"
        [mode]="'side'"
        [opened]="true">
        <mat-toolbar>Customer Manager</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/customers" routerLinkActive="active">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Customers</span>
          </a>
          <a mat-list-item routerLink="/customers/new" routerLinkActive="active">
            <mat-icon matListItemIcon>person_add</mat-icon>
            <span matListItemTitle>New Customer</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button
            type="button"
            aria-label="Toggle sidenav"
            mat-icon-button
            (click)="drawer.toggle()">
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>
          <span class="spacer"></span>
          
          @if (authService.currentUser(); as user) {
            <span class="user-email">{{ user.email }}</span>
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          }
        </mat-toolbar>
        
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    
    .sidenav {
      width: 250px;
      background-color: #fafafa;
    }
    
    .sidenav .mat-toolbar {
      background: inherit;
    }
    
    .mat-toolbar.mat-primary {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .user-email {
      font-size: 14px;
      margin-right: 12px;
      opacity: 0.9;
    }
    
    .content {
      padding: 20px;
      background-color: #f5f5f5;
      min-height: calc(100vh - 64px);
    }
    
    .active {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class LayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  
  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
