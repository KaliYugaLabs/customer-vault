import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="customer-list-container">
      <div class="header">
        <div>
          <h1>Customers</h1>
          <p class="subtitle">Manage your customer database</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/customers/new">
          <mat-icon>add</mat-icon>
          Add Customer
        </button>
      </div>
      
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search customers</mat-label>
        <input matInput 
               [(ngModel)]="searchQuery" 
               (ngModelChange)="onSearch($event)"
               placeholder="Search by name, email, ID number, or address">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading customers...</p>
        </div>
      } @else if (filteredCustomers().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">people_outline</mat-icon>
          <h3>No customers found</h3>
          <p>{{ searchQuery() ? 'Try adjusting your search' : 'Get started by adding your first customer' }}</p>
          @if (!searchQuery()) {
            <button mat-raised-button color="primary" routerLink="/customers/new">
              Add Customer
            </button>
          }
        </div>
      } @else {
        <div class="table-container">
          <table mat-table [dataSource]="filteredCustomers()" class="mat-elevation-z2">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let customer">
                <div class="customer-name">
                  <strong>{{ customer.firstName }} {{ customer.lastName }}</strong>
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="idNumber">
              <th mat-header-cell *matHeaderCellDef>ID Number</th>
              <td mat-cell *matCellDef="let customer">
                <code class="id-number">{{ customer.idNumber }}</code>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let customer">
                <a [href]="'mailto:' + customer.email" class="email-link">
                  {{ customer.email }}
                </a>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Phone</th>
              <td mat-cell *matCellDef="let customer">
                @if (customer.phone) {
                  <a [href]="'tel:' + customer.phone" class="phone-link">
                    {{ customer.phone }}
                  </a>
                } @else {
                  <span class="no-data">-</span>
                }
              </td>
            </ng-container>
            
            <ng-container matColumnDef="address">
              <th mat-header-cell *matHeaderCellDef>Address</th>
              <td mat-cell *matCellDef="let customer">
                <div class="address-cell" [matTooltip]="customer.formattedAddress || customer.address">
                  <mat-icon class="location-icon">location_on</mat-icon>
                  <span class="address-text">{{ customer.address }}</span>
                </div>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
              <td mat-cell *matCellDef="let customer" class="actions-cell">
                <button mat-icon-button 
                        color="primary" 
                        [routerLink]="['/customers/edit', customer.id]"
                        matTooltip="Edit customer">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button 
                        color="warn" 
                        (click)="deleteCustomer(customer)"
                        matTooltip="Delete customer">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        
        <div class="results-info">
          Showing {{ filteredCustomers().length }} of {{ customers().length }} customers
        </div>
      }
    </div>
  `,
  styles: [`
    .customer-list-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    
    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }
    
    .subtitle {
      margin: 4px 0 0 0;
      color: #666;
    }
    
    .search-field {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .loading-container p {
      margin-top: 16px;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .empty-state h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
    }
    
    .empty-state p {
      margin: 0 0 24px 0;
    }
    
    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
    }
    
    table {
      width: 100%;
    }
    
    th {
      font-weight: 600;
      color: #333;
      background-color: #f5f5f5;
    }
    
    .customer-name strong {
      color: #333;
    }
    
    .id-number {
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .email-link, .phone-link {
      color: #673ab7;
      text-decoration: none;
    }
    
    .email-link:hover, .phone-link:hover {
      text-decoration: underline;
    }
    
    .no-data {
      color: #999;
    }
    
    .address-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 250px;
    }
    
    .location-icon {
      color: #f44336;
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    
    .address-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .actions-header {
      text-align: right;
    }
    
    .actions-cell {
      text-align: right;
      white-space: nowrap;
    }
    
    .results-info {
      margin-top: 16px;
      text-align: right;
      color: #666;
      font-size: 14px;
    }
  `]
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private snackBar = inject(MatSnackBar);
  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  
  customers = signal<Customer[]>([]);
  filteredCustomers = signal<Customer[]>([]);
  searchQuery = signal('');
  loading = signal(true);
  displayedColumns = ['name', 'idNumber', 'email', 'phone', 'address', 'actions'];
  
  ngOnInit() {
    this.loadCustomers();
    
    // Search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.performSearch();
    });
  }
  
  async loadCustomers() {
    this.loading.set(true);
    try {
      const customers = await this.customerService.getAll();
      this.customers.set(customers);
      this.filteredCustomers.set(customers);
    } catch (error) {
      console.error('Failed to load customers:', error);
      this.snackBar.open('Failed to load customers', 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
  
  onSearch(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }
  
  private async performSearch() {
    const query = this.searchQuery();
    if (!query) {
      this.filteredCustomers.set(this.customers());
      return;
    }
    
    try {
      const results = await this.customerService.search(query);
      this.filteredCustomers.set(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }
  
  async deleteCustomer(customer: Customer) {
    const confirmed = confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`);
    if (!confirmed) return;
    
    try {
      await this.customerService.delete(customer.id!);
      this.snackBar.open('Customer deleted successfully', 'Close', { duration: 3000 });
      this.loadCustomers();
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      this.snackBar.open(error.message || 'Failed to delete customer', 'Close', { duration: 5000 });
    }
  }
}
