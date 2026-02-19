# Refactoring Plan: Modernization with Firebase (Updated)

**Project**: ng-node-firebase  
**Current Version**: Angular 4 + Firebase v4 + Google Maps API  
**Target Version**: Angular 19 + Firebase v11 + OpenStreetMap (Free)  
**Estimated Timeline**: 3-4 weeks  
**Monthly Cost**: $0 (Firebase Spark plan + free APIs)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Target Architecture](#target-architecture)
4. [Phase 1: Backend Modernization](#phase-1-backend-modernization)
5. [Phase 2: Frontend Migration](#phase-2-frontend-migration)
6. [Phase 3: Security Hardening](#phase-3-security-hardening)
7. [Phase 4: Testing & Deployment](#phase-4-testing--deployment)
8. [Cost Analysis](#cost-analysis)
9. [Risk Assessment](#risk-assessment)
10. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Why Refactor?

The current codebase (circa 2017) has several critical issues:

- **Security vulnerabilities**: Exposed API keys, anonymous authentication only, wildcard CORS
- **Outdated dependencies**: Angular 4 is 8+ years old, Firebase v4 deprecated
- **Paid APIs**: Google Maps API incurs costs
- **Maintenance burden**: Old dependencies have known security issues
- **No real user management**: Anyone can access via anonymous auth

### Goals

1. Upgrade to modern Firebase (v11) with Firestore
2. Implement real Email/Password authentication with user registration
3. Replace paid Google Maps with free OpenStreetMap
4. Modern Angular 19 with standalone components
5. Keep costs at $0 with Firebase Spark plan
6. Security hardening (JWT, rate limiting, input validation)

---

## Current Architecture Analysis

### Frontend (Angular 4)

```
Tech Stack:
- Angular 4.0.0 (Released March 2017)
- Angular Material 2.0.0-beta.8
- RxJS 5.4.1 (pre-pipeable operators)
- @angular/http (deprecated, replaced by HttpClient)
- Firebase 4.2.0
- AngularFire2 4.0.0-rc.1

Issues:
- 50+ major versions behind current Angular
- Security vulnerabilities in dependencies
- Memory leaks from unsubscribed observables
- Broken unit tests
- Anonymous authentication (no real security)
```

### Backend (Node.js/Express)

```
Tech Stack:
- Express 4.15.3
- Firebase Admin 5.1.0 (deprecated)
- Elasticsearch 13.2.0 (paid Bonsai)
- @google/maps 0.4.3 (paid API)

Issues:
- Firebase Admin SDK 5.x is deprecated (current: v12.x)
- Elasticsearch client incompatible with modern ES
- @google/maps package deprecated
- No input validation
- No rate limiting
- Full error stack traces sent to client
- CORS allows all origins (*)
```

### External Services (Current Costs)

| Service | Current Cost | Usage |
|---------|--------------|-------|
| Google Maps API | $50-100/mo | Geocoding, autocomplete |
| Firebase Realtime DB | $0-20/mo | Data storage (within free tier) |
| Elasticsearch Bonsai | $29-79/mo | Full-text search |

**Total Current Cost**: $79-199/month (estimated)

---

## Target Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Angular 19)                      │
│  ├─ Modern Material UI v19                                  │
│  ├─ Standalone Components                                   │
│  ├─ Signals (Reactivity)                                    │
│  ├─ Firebase SDK v11 (Auth + Firestore)                    │
│  └─ Leaflet.js + OpenStreetMap (FREE)                      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Express)                     │
│  ├─ Rate Limiting (express-rate-limit)                     │
│  ├─ Security Headers (Helmet)                              │
│  ├─ CORS (whitelist origins)                               │
│  ├─ JWT Authentication                                     │
│  ├─ Firebase Admin SDK v12                                 │
│  ├─ Firestore Database                                     │
│  └─ Input Validation (Zod)                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │  Nominatim (OSM) │  ← FREE geocoding
                   │  (1 req/sec)     │     replaces Google Maps
                   └──────────────────┘
```

### Firebase Spark Plan (Free Tier)

| Feature | Free Tier | Notes |
|---------|-----------|-------|
| **Firestore** | 1GB storage, 50K reads/day, 20K writes/day, 20K deletes/day | Generous for small app |
| **Auth** | 50K monthly active users | Email/password, social providers |
| **Hosting** | 1GB storage, 10GB/month transfer | For static files |
| **Cloud Functions** | 2M invocations/month | Optional for backend |

**Total Target Cost**: $0/month (within Spark plan limits)

---

## Phase 1: Backend Modernization

### 1.1 Technology Stack

```json
{
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "express-rate-limit": "^7.5.0",
    "firebase-admin": "^12.7.0",
    "zod": "^3.24.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "nodemon": "^3.1.0",
    "ts-node": "^10.9.0"
  }
}
```

### 1.2 Firebase Setup

#### Firestore Data Structure

```
customers (collection)
  └── {customerId} (document)
      ├── idNumber: string
      ├── firstName: string
      ├── lastName: string
      ├── email: string
      ├── phone: string
      ├── address: string
      ├── formattedAddress: string
      ├── coordinates: GeoPoint
      ├── createdAt: Timestamp
      ├── updatedAt: Timestamp
      └── createdBy: string (user UID)

users (collection)
  └── {userId} (document)
      ├── email: string
      ├── displayName: string
      ├── createdAt: Timestamp
      └── role: 'user' | 'admin'
```

#### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Customers collection - users can only access their own customers
    match /customers/{customerId} {
      allow create: if isAuthenticated() 
        && request.resource.data.createdBy == request.auth.uid;
      
      allow read, update, delete: if isAuthenticated() 
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

### 1.3 API Endpoints

```typescript
// Auth Routes
POST   /api/v1/auth/register          // Register new user
POST   /api/v1/auth/login             // Login with email/password
POST   /api/v1/auth/logout            // Logout
GET    /api/v1/auth/me                // Get current user
POST   /api/v1/auth/forgot-password   // Send password reset email

// Customer Routes (Protected)
GET    /api/v1/customers              // List customers (with search)
POST   /api/v1/customers              // Create new customer
GET    /api/v1/customers/:id          // Get single customer
PUT    /api/v1/customers/:id          // Update customer
DELETE /api/v1/customers/:id          // Delete customer

// Utility Routes
GET    /api/v1/geocode?q=address      // Geocode address via Nominatim
GET    /api/v1/autocomplete?q=query   // Address autocomplete
GET    /api/v1/health                 // Health check
```

### 1.4 Backend Implementation

#### Firebase Admin Initialization

```typescript
// config/firebase.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = getFirestore();
export const auth = getAuth();
```

#### Customer Service

```typescript
// services/customer.service.ts
import { db } from '../config/firebase';
import { Customer } from '../models/customer.model';
import { FieldValue } from 'firebase-admin/firestore';

export class CustomerService {
  private collection = db.collection('customers');
  
  async create(data: Customer, userId: string): Promise<Customer> {
    const customerData = {
      ...data,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    const docRef = await this.collection.add(customerData);
    return { id: docRef.id, ...customerData } as Customer;
  }
  
  async findByUser(userId: string): Promise<Customer[]> {
    const snapshot = await this.collection
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
  }
  
  async search(query: string, userId: string): Promise<Customer[]> {
    // Firestore doesn't support full-text search natively
    // We'll fetch user's customers and filter in memory for now
    // For production, consider Algolia (free tier) or Elasticsearch
    const customers = await this.findByUser(userId);
    const lowerQuery = query.toLowerCase();
    
    return customers.filter(customer =>
      customer.firstName?.toLowerCase().includes(lowerQuery) ||
      customer.lastName?.toLowerCase().includes(lowerQuery) ||
      customer.email?.toLowerCase().includes(lowerQuery) ||
      customer.address?.toLowerCase().includes(lowerQuery)
    );
  }
  
  async update(id: string, data: Partial<Customer>, userId: string): Promise<Customer> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error('Customer not found');
    }
    
    if (doc.data()?.createdBy !== userId) {
      throw new Error('Unauthorized');
    }
    
    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Customer;
  }
  
  async delete(id: string, userId: string): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error('Customer not found');
    }
    
    if (doc.data()?.createdBy !== userId) {
      throw new Error('Unauthorized');
    }
    
    await docRef.delete();
  }
}
```

### 1.5 Security Middleware

```typescript
// middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { auth } from '../config/firebase';

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "*.openstreetmap.org"],
      connectSrc: ["'self'", "*.googleapis.com", "*.firebaseio.com"],
    },
  },
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

export const corsOptions = cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again later.' }
});

// JWT Authentication middleware
export async function authenticateToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

### 1.6 Validation Schema (Zod)

```typescript
// validation/schemas.ts
import { z } from 'zod';

export const customerSchema = z.object({
  idNumber: z.string()
    .length(13, 'ID number must be 13 digits')
    .regex(/^\d+$/, 'ID number must contain only digits'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name'),
  
  email: z.string()
    .email('Invalid email address'),
  
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]{10,20}$/, 'Invalid phone number')
    .optional().or(z.literal('')),
  
  address: z.string()
    .min(5, 'Address is too short')
    .max(500, 'Address is too long')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Name is required').max(100)
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

### 1.7 Nominatim Integration (FREE Geocoding)

```typescript
// services/geocoding.service.ts
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    'accept-language': 'en'
  });
  
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/search?${params}`,
    {
      headers: {
        'User-Agent': 'CustomerManager/1.0 (your-email@example.com)'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }
  
  const data = await response.json();
  
  if (data.length === 0) {
    throw new Error('Address not found');
  }
  
  return {
    formattedAddress: data[0].display_name,
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon)
  };
}

export async function autocompleteAddress(query: string): Promise<string[]> {
  if (query.length < 3) return [];
  
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    'accept-language': 'en'
  });
  
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/search?${params}`,
    {
      headers: {
        'User-Agent': 'CustomerManager/1.0 (your-email@example.com)'
      }
    }
  );
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.map((item: any) => ({
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon)
  }));
}
```

---

## Phase 2: Frontend Migration

### 2.1 Technology Stack

```json
{
  "dependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/cdk": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/material": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/platform-browser-dynamic": "^19.0.0",
    "@angular/router": "^19.0.0",
    "firebase": "^11.2.0",
    "@angular/fire": "^19.0.0",
    "leaflet": "^1.9.4",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "@types/leaflet": "^1.9.0",
    "typescript": "^5.6.0"
  }
}
```

### 2.2 Firebase Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id'
  },
  apiUrl: 'http://localhost:3000/api/v1'
};
```

```typescript
// app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { environment } from './environments/environment';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore())
    ])
  ]
};
```

### 2.3 Auth Service

```typescript
// services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { doc, setDoc, Firestore, serverTimestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  
  constructor(private auth: Auth, private firestore: Firestore) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      this.isAuthenticated.set(!!user);
    });
  }
  
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }
  
  async register(email: string, password: string, displayName: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
      email,
      displayName,
      createdAt: serverTimestamp(),
      role: 'user'
    });
  }
  
  async logout(): Promise<void> {
    await signOut(this.auth);
  }
  
  async getIdToken(): Promise<string | null> {
    const user = this.currentUser();
    return user ? await user.getIdToken() : null;
  }
}
```

### 2.4 Customer Service

```typescript
// services/customer.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  async getAll(): Promise<Customer[]> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const customersRef = collection(this.firestore, 'customers');
    const q = query(
      customersRef,
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Customer[];
  }
  
  async search(searchTerm: string): Promise<Customer[]> {
    const customers = await this.getAll();
    if (!searchTerm) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.firstName?.toLowerCase().includes(term) ||
      c.lastName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term)
    );
  }
  
  async create(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Not authenticated');
    
    const customersRef = collection(this.firestore, 'customers');
    const docRef = await addDoc(customersRef, {
      ...customer,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { id: docRef.id, ...customer };
  }
  
  async update(id: string, data: Partial<Customer>): Promise<void> {
    const docRef = doc(this.firestore, 'customers', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }
  
  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'customers', id);
    await deleteDoc(docRef);
  }
}
```

### 2.5 Standalone Component Example

```typescript
// components/customer-list.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="customer-list-container">
      <div class="header">
        <h2>Customers</h2>
        <button mat-raised-button color="primary" routerLink="/customers/new">
          <mat-icon>add</mat-icon> Add Customer
        </button>
      </div>
      
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search customers</mat-label>
        <input matInput 
               [(ngModel)]="searchQuery" 
               (ngModelChange)="onSearch($event)"
               placeholder="Search by name, email, or address">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      
      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <table mat-table [dataSource]="filteredCustomers()" class="mat-elevation-z2">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let customer">
              {{ customer.firstName }} {{ customer.lastName }}
            </td>
          </ng-container>
          
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let customer">{{ customer.email }}</td>
          </ng-container>
          
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let customer">{{ customer.phone || '-' }}</td>
          </ng-container>
          
          <ng-container matColumnDef="address">
            <th mat-header-cell *matHeaderCellDef>Address</th>
            <td mat-cell *matCellDef="let customer">{{ customer.address }}</td>
          </ng-container>
          
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let customer">
              <button mat-icon-button color="primary" [routerLink]="['/customers/edit', customer.id]">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteCustomer(customer)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .customer-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .search-field {
      width: 100%;
      margin-bottom: 16px;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    table {
      width: 100%;
    }
  `]
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  
  customers = signal<Customer[]>([]);
  searchQuery = signal('');
  loading = signal(false);
  displayedColumns = ['name', 'email', 'phone', 'address', 'actions'];
  
  filteredCustomers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.customers();
    
    return this.customers().filter(customer =>
      customer.firstName?.toLowerCase().includes(query) ||
      customer.lastName?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  });
  
  ngOnInit() {
    this.loadCustomers();
    
    // Server-side search with debounce
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
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  onSearch(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }
  
  private async performSearch() {
    this.loading.set(true);
    try {
      const results = await this.customerService.search(this.searchQuery());
      this.customers.set(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  async deleteCustomer(customer: Customer) {
    if (!confirm(`Delete ${customer.firstName} ${customer.lastName}?`)) return;
    
    try {
      await this.customerService.delete(customer.id!);
      this.loadCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer. Please try again.');
    }
  }
}
```

---

## Phase 3: Security Hardening

### 3.1 Security Checklist

- [ ] Remove all hardcoded API keys from source code (use environment variables)
- [ ] Implement Email/Password authentication (replace anonymous auth)
- [ ] Add rate limiting on all endpoints
- [ ] CORS restricted to specific origins
- [ ] Helmet.js security headers
- [ ] Input validation on all endpoints (Zod)
- [ ] Firestore Security Rules with user isolation
- [ ] XSS protection (output encoding)
- [ ] Secure error messages (no stack traces to client)
- [ ] HTTPS enforcement in production
- [ ] Password hashing (handled by Firebase Auth)
- [ ] JWT token validation

### 3.2 Environment Variables

```bash
# .env.example (backend)
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200

# Firebase Admin SDK (service account JSON)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

```typescript
// environments/environment.ts (frontend)
export const environment = {
  production: false,
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || '',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || '',
    projectId: process.env['FIREBASE_PROJECT_ID'] || '',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || '',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || '',
    appId: process.env['FIREBASE_APP_ID'] || ''
  },
  apiUrl: 'http://localhost:3000/api/v1'
};
```

---

## Phase 4: Testing & Deployment

### 4.1 Testing Strategy

```typescript
// Example: Customer service test
import { TestBed } from '@angular/core/testing';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { CustomerService } from './customer.service';
import { environment } from '../environments/environment';

describe('CustomerService', () => {
  let service: CustomerService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomerService,
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth())
      ]
    });
    
    service = TestBed.inject(CustomerService);
  });
  
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

### 4.2 Deployment

**Backend (Railway/Render)**:
```yaml
# railway.yml
build:
  builder: DOCKERFILE
  dockerfilePath: ./Dockerfile

deploy:
  startCommand: node dist/app.js
  healthcheckPath: /api/v1/health
```

**Frontend (Vercel)**:
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/frontend/browser",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Cost Analysis

### Before vs After

| Component | Current | New | Savings |
|-----------|---------|-----|---------|
| Maps API | Google Maps ($50-100/mo) | OpenStreetMap ($0) | $50-100/mo |
| Database | Firebase RTDB ($0-20/mo) | Firestore ($0) | $0 |
| Search | Elasticsearch ($29/mo) | Firestore queries ($0) | $29/mo |
| Auth | Firebase Anonymous ($0) | Firebase Auth ($0) | $0 |
| Hosting | Firebase ($0) | Vercel ($0) | $0 |
| **Total** | **$79-149/mo** | **$0** | **$79-149/mo** |

### Firebase Spark Plan Limits

| Feature | Free Tier | Notes |
|---------|-----------|-------|
| **Firestore** | 1GB storage, 50K reads/day, 20K writes/day | Generous for small-medium app |
| **Auth** | 50K monthly active users | Email/password + social |
| **Hosting** | 1GB storage, 10GB/month transfer | For static files |
| **Cloud Functions** | 2M invocations/month | Optional backend |

**Important**: Firestore reads can add up quickly with search. Consider implementing client-side caching or pagination.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Nominatim rate limits (1 req/sec) | Medium | Medium | Implement client-side debouncing, cache results |
| Firebase Spark limits exceeded | Low | High | Monitor usage, upgrade to Blaze if needed |
| Breaking changes in dependencies | Low | High | Pin versions, test thoroughly |
| Data migration issues | Medium | High | Create backup, test migration script |
| Firestore query limitations | Medium | Medium | Use client-side filtering for search |

---

## Implementation Checklist

### Week 1: Backend Setup
- [ ] Create Firebase project (or use existing)
- [ ] Setup Firebase Admin SDK
- [ ] Configure Firestore database
- [ ] Write Firestore security rules
- [ ] Setup Express project structure
- [ ] Implement authentication endpoints
- [ ] Implement customer CRUD endpoints
- [ ] Integrate Nominatim geocoding
- [ ] Add security middleware
- [ ] Write API tests

### Week 2: Frontend Foundation
- [ ] Create new Angular 19 project
- [ ] Setup Angular Material v19
- [ ] Configure Firebase SDK
- [ ] Implement auth components (login/register)
- [ ] Create auth guard
- [ ] Setup routing

### Week 3: Feature Implementation
- [ ] Customer list component
- [ ] Customer form component (create/edit)
- [ ] Address autocomplete with Nominatim
- [ ] Map integration (Leaflet + OpenStreetMap)
- [ ] Search functionality
- [ ] Error handling and loading states

### Week 4: Polish & Deploy
- [ ] Form validation feedback
- [ ] Unit tests for services
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel

---

## Migration Script (Firebase RTDB → Firestore)

```typescript
// scripts/migrate-data.ts
import * as admin from 'firebase-admin';

// Initialize with old project (Realtime DB)
const oldApp = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.OLD_FIREBASE_KEY!)),
  databaseURL: process.env.OLD_FIREBASE_URL
}, 'old');

// Initialize with new project (Firestore)
const newApp = admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.NEW_FIREBASE_KEY!))
}, 'new');

const oldDb = oldApp.database();
const newDb = newApp.firestore();

async function migrate() {
  console.log('Starting migration...');
  
  // Get all customers from Realtime DB
  const snapshot = await oldDb.ref('/customers').once('value');
  const customers = snapshot.val();
  
  if (!customers) {
    console.log('No customers to migrate');
    return;
  }
  
  // Migrate to Firestore
  const batch = newDb.batch();
  let count = 0;
  
  for (const [id, data] of Object.entries(customers)) {
    const customerRef = newDb.collection('customers').doc(id);
    batch.set(customerRef, {
      ...data,
      migratedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    count++;
  }
  
  await batch.commit();
  console.log(`Migrated ${count} customers successfully!`);
}

migrate().catch(console.error);
```

---

## Key Differences from Original Plan

| Aspect | Original (Supabase) | Updated (Firebase) |
|--------|--------------------|--------------------|
| **Database** | PostgreSQL | Firestore (NoSQL) |
| **Search** | PostgreSQL FTS | Client-side filtering (Firestore limitations) |
| **Auth** | Supabase Auth | Firebase Auth |
| **Backend** | Required | Optional (can use Firebase SDK directly) |
| **Hosting** | Vercel + Railway | Vercel + optional Railway |

---

## Final Architecture Summary

```
Angular 19 Frontend (Vercel)
├─ Firebase SDK v11 (Auth + Firestore)
├─ Angular Material v19
├─ Leaflet.js + OpenStreetMap
└─ RxJS 7 + Signals

Optional: Express Backend (Railway)
├─ Firebase Admin SDK
├─ Nominatim Geocoding
└─ Security middleware
```

**Advantages of Firebase approach:**
1. Real-time sync built-in (Firestore listeners)
2. Offline persistence
3. Simpler architecture (can skip backend)
4. Better Angular integration (@angular/fire)
5. Established ecosystem

---

## Next Steps

1. **Review this updated plan**
2. **Create Firebase project** or update existing
3. **Generate new Firebase config** (get new API keys)
4. **Run migration script** (if keeping existing data)
5. **Start with frontend** (Firebase SDK works standalone)
6. **Add backend later** if needed for geocoding proxy

---

**Document Version**: 2.0 (Firebase Edition)  
**Updated**: 2026-02-18  
**Status**: Ready for Implementation
