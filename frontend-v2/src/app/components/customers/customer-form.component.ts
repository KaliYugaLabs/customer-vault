import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../../services/customer.service';
import { GeocodingService } from '../../services/geocoding.service';
import { Customer, AddressSuggestion } from '../../models/customer.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Customer' : 'New Customer' }}</mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode ? 'Update customer information' : 'Add a new customer to your database' }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>First Name</mat-label>
                <input matInput 
                       formControlName="firstName"
                       placeholder="Enter first name">
                <mat-icon matSuffix>person</mat-icon>
                @if (customerForm.get('firstName')?.hasError('required')) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Last Name</mat-label>
                <input matInput 
                       formControlName="lastName"
                       placeholder="Enter last name">
                <mat-icon matSuffix>person</mat-icon>
                @if (customerForm.get('lastName')?.hasError('required')) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>
            </div>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>ID Number</mat-label>
              <input matInput 
                     formControlName="idNumber"
                     placeholder="Enter 13-digit ID number"
                     maxlength="13">
              <mat-icon matSuffix>badge</mat-icon>
              <mat-hint>13 digits, numbers only</mat-hint>
              @if (customerForm.get('idNumber')?.hasError('required')) {
                <mat-error>ID number is required</mat-error>
              }
              @if (customerForm.get('idNumber')?.hasError('pattern')) {
                <mat-error>ID number must be 13 digits</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email"
                     formControlName="email"
                     placeholder="Enter email address">
              <mat-icon matSuffix>email</mat-icon>
              @if (customerForm.get('email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (customerForm.get('email')?.hasError('email')) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone</mat-label>
              <input matInput 
                     formControlName="phone"
                     placeholder="Enter phone number">
              <mat-icon matSuffix>phone</mat-icon>
              <mat-hint>Optional</mat-hint>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address</mat-label>
              <input matInput 
                     formControlName="address"
                     placeholder="Start typing to search addresses"
                     [matAutocomplete]="auto"
                     (blur)="onAddressBlur()">
              <mat-icon matSuffix>location_on</mat-icon>
              @if (isGeocoding()) {
                <mat-progress-spinner matSuffix 
                                     diameter="20" 
                                     mode="indeterminate">
                </mat-progress-spinner>
              }
              @if (customerForm.get('address')?.hasError('required')) {
                <mat-error>Address is required</mat-error>
              }
              
              <mat-autocomplete #auto="matAutocomplete" 
                               (optionSelected)="onAddressSelected($event)">
                @for (suggestion of addressSuggestions(); track suggestion.displayName) {
                  <mat-option [value]="suggestion.displayName">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ suggestion.displayName }}</span>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            
            @if (selectedAddress()) {
              <div class="selected-address">
                <mat-icon>check_circle</mat-icon>
                <span>Address verified</span>
              </div>
            }
            
            <div class="form-actions">
              <button mat-button 
                      type="button" 
                      routerLink="/customers">
                Cancel
              </button>
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="customerForm.invalid || isSaving()">
                @if (isSaving()) {
                  <mat-spinner diameter="20" class="spinner"></mat-spinner>
                  <span>Saving...</span>
                } @else {
                  <span>{{ isEditMode ? 'Update Customer' : 'Create Customer' }}</span>
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    mat-card {
      padding: 24px;
    }
    
    mat-card-header {
      margin-bottom: 24px;
    }
    
    mat-card-title {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    
    .form-field {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    
    .selected-address {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4caf50;
      margin-bottom: 16px;
      padding: 12px;
      background-color: #e8f5e9;
      border-radius: 4px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    button[type="submit"] {
      min-width: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .spinner {
      display: inline-block;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private geocodingService = inject(GeocodingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private addressSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  
  customerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    idNumber: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: ['', Validators.required]
  });
  
  isEditMode = false;
  customerId: string | null = null;
  isSaving = signal(false);
  isGeocoding = signal(false);
  addressSuggestions = signal<AddressSuggestion[]>([]);
  selectedAddress = signal<AddressSuggestion | null>(null);
  
  ngOnInit() {
    // Check if in edit mode
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.customerId;
    
    if (this.isEditMode && this.customerId) {
      this.loadCustomer(this.customerId);
    }
    
    // Setup address autocomplete
    this.addressSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(async (query) => {
      if (query.length >= 3) {
        const suggestions = await this.geocodingService.searchAddress(query);
        this.addressSuggestions.set(suggestions);
      } else {
        this.addressSuggestions.set([]);
      }
    });
    
    // Listen to address changes
    this.customerForm.get('address')?.valueChanges.subscribe((value) => {
      this.addressSubject.next(value);
      // Clear selected address when user types
      if (this.selectedAddress() && value !== this.selectedAddress()?.displayName) {
        this.selectedAddress.set(null);
      }
    });
  }
  
  async loadCustomer(id: string) {
    try {
      const customer = await this.customerService.getById(id);
      if (customer) {
        this.customerForm.patchValue({
          firstName: customer.firstName,
          lastName: customer.lastName,
          idNumber: customer.idNumber,
          email: customer.email,
          phone: customer.phone || '',
          address: customer.address
        });
        
        if (customer.latitude && customer.longitude) {
          this.selectedAddress.set({
            displayName: customer.formattedAddress || customer.address,
            latitude: customer.latitude,
            longitude: customer.longitude
          });
        }
      } else {
        this.snackBar.open('Customer not found', 'Close', { duration: 3000 });
        this.router.navigate(['/customers']);
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
      this.snackBar.open('Failed to load customer', 'Close', { duration: 3000 });
    }
  }
  
  onAddressSelected(event: any) {
    const selectedValue = event.option.value;
    const suggestion = this.addressSuggestions().find(s => s.displayName === selectedValue);
    if (suggestion) {
      this.selectedAddress.set(suggestion);
    }
  }
  
  async onAddressBlur() {
    // If no address was selected from autocomplete, try to geocode the input
    const addressValue = this.customerForm.get('address')?.value;
    if (addressValue && !this.selectedAddress()) {
      this.isGeocoding.set(true);
      try {
        const result = await this.geocodingService.geocodeAddress(addressValue);
        if (result) {
          this.selectedAddress.set(result);
        }
      } finally {
        this.isGeocoding.set(false);
      }
    }
  }
  
  async onSubmit(): Promise<void> {
    if (this.customerForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.customerForm.controls).forEach(key => {
        this.customerForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isSaving.set(true);
    
    try {
      const formValue = this.customerForm.value;
      const addressData = this.selectedAddress();
      
      const customerData = {
        ...formValue,
        formattedAddress: addressData?.displayName || formValue.address,
        latitude: addressData?.latitude,
        longitude: addressData?.longitude
      };
      
      if (this.isEditMode && this.customerId) {
        await this.customerService.update(this.customerId, customerData);
        this.snackBar.open('Customer updated successfully', 'Close', { duration: 3000 });
      } else {
        await this.customerService.create(customerData);
        this.snackBar.open('Customer created successfully', 'Close', { duration: 3000 });
      }
      
      this.router.navigate(['/customers']);
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      this.snackBar.open(error.message || 'Failed to save customer', 'Close', { duration: 5000 });
    } finally {
      this.isSaving.set(false);
    }
  }
}
