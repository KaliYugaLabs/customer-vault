# Quick Start Guide: Firebase Edition (Updated)

## Overview

This guide helps you set up the refactored project using **Firebase** (instead of Supabase) with **Angular 19**.

**Stack:**
- Frontend: Angular 19 + Angular Material + Firebase SDK v11
- Backend: Express + Firebase Admin SDK (optional, for geocoding proxy)
- Database: Firestore (NoSQL)
- Auth: Firebase Auth (Email/Password)
- Maps: OpenStreetMap (Nominatim) - FREE

---

## Prerequisites

- Node.js 20+ (use [nvm](https://github.com/nvm-sh/nvm))
- npm 10+ or pnpm/yarn
- Git
- A Firebase account (Google account)
- (Optional) Vercel account for deployment

---

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "customer-manager-v2")
4. **Disable** Google Analytics (or enable if you want)
5. Click "Create project"

### 1.2 Enable Firestore Database

1. Go to "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose **"Start in production mode"**
4. Select location closest to your users (e.g., `us-central`)
5. Click "Enable"

### 1.3 Enable Authentication

1. Go to "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable **"Email/Password"**
   - Enable "Email link (passwordless sign-in)" - optional
   - Save

### 1.4 Get Firebase Config (Frontend)

1. Go to Project Settings (gear icon)
2. Under "Your apps", click "</>" (web icon)
3. Enter app nickname: "customer-manager-web"
4. **Check** "Also set up Firebase Hosting" (optional)
5. Click "Register app"
6. Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

Save this for later!

### 1.5 Generate Service Account Key (Backend)

1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Click "Generate key"
4. Save the JSON file securely (e.g., `firebase-service-account.json`)
5. **Never commit this file to git!**

---

## Step 2: Environment Setup

```bash
# Verify Node.js version
node --version  # Should be v20.x.x or higher

# Install Angular CLI globally
npm install -g @angular/cli@latest

# Verify Angular CLI
ng version  # Should be v19.x.x
```

---

## Step 3: Frontend Setup

```bash
# From project root
cd ng-node-firebase

# Create new Angular 19 project
npx @angular/cli@latest new frontend-v2 --routing --style=scss

# Navigate to new project
cd frontend-v2

# Add Angular Material
ng add @angular/material

# Choose your preferred theme
# Choose "Y" for typography
# Choose "Y" for animations

# Install Firebase and AngularFire
npm install firebase @angular/fire

# Install additional dependencies
npm install leaflet @types/leaflet
```

### 3.1 Configure Firebase

Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: '123456789',
    appId: 'YOUR_APP_ID'
  },
  apiUrl: 'http://localhost:3000/api/v1'  // Only needed if using backend
};
```

Create `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || '',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || '',
    projectId: process.env['FIREBASE_PROJECT_ID'] || '',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || '',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || '',
    appId: process.env['FIREBASE_APP_ID'] || ''
  },
  apiUrl: process.env['API_URL'] || '/api/v1'
};
```

### 3.2 Initialize Firebase in App

Update `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore())
    ])
  ]
};
```

### 3.3 Setup Firestore Security Rules

In Firebase Console:
1. Go to Firestore Database
2. Click "Rules" tab
3. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Customers collection - users can only access their own
    match /customers/{customerId} {
      allow create: if isAuthenticated() 
        && request.resource.data.createdBy == request.auth.uid;
      
      allow read, update, delete: if isAuthenticated() 
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

4. Click "Publish"

---

## Step 4: Backend Setup (Optional)

**Note:** You can skip this step if you want to use Firebase SDK directly from the frontend. The backend is only needed for:
- Proxying geocoding requests (to hide API keys)
- Server-side operations

```bash
# From project root
mkdir backend-v2
cd backend-v2

# Initialize project
npm init -y

# Install dependencies
npm install express cors helmet express-rate-limit \
  firebase-admin zod dotenv

# Install dev dependencies
npm install -D typescript @types/node @types/express \
  @types/cors nodemon ts-node

# Initialize TypeScript
npx tsc --init
```

### 4.1 TypeScript Configuration

Edit `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.2 Environment Variables

Create `.env` file:

```bash
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200

# Firebase Admin SDK (paste entire JSON content here)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

Create `.env.example` (for git):

```bash
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200
FIREBASE_SERVICE_ACCOUNT=
```

Add to `.gitignore`:

```
.env
firebase-service-account.json
node_modules/
dist/
*.log
```

### 4.3 Firebase Admin Setup

Create `src/config/firebase.ts`:

```typescript
import * as admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
export const auth = admin.auth();
```

---

## Step 5: Running the Application

### Option A: Frontend Only (Recommended for Start)

```bash
cd frontend-v2
ng serve
```

App runs on http://localhost:4200

The frontend connects directly to Firebase, no backend needed!

### Option B: With Backend

**Terminal 1 - Backend:**
```bash
cd backend-v2
npm run dev  # Uses nodemon for auto-reload
```

Server runs on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend-v2
ng serve
```

App runs on http://localhost:4200

---

## Step 6: Testing

### Frontend Tests

```bash
cd frontend-v2
ng test        # Unit tests
ng e2e         # E2E tests (if configured)
```

### Backend Tests

```bash
cd backend-v2
npm test       # If tests are configured
```

---

## Project Structure

```
ng-node-firebase/
├── frontend-v2/              # New Angular 19 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── guards/
│   │   ├── environments/
│   │   └── main.ts
│   ├── angular.json
│   └── package.json
│
├── backend-v2/               # New Node.js backend (optional)
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Old backend (backup)
├── frontend/                 # Old frontend (backup)
└── docs/
    ├── REFACTORING_PLAN.md
    └── QUICKSTART.md
```

---

## Common Issues

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution:** Check your Firebase config in `environment.ts`. Make sure all values are correct and match your Firebase project.

### Issue: "Missing or insufficient permissions"

**Solution:** Check Firestore security rules. Make sure you're authenticated and the rules allow access.

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:** If using backend, configure CORS:

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));
```

### Issue: Port 3000 already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: "Cannot find module 'firebase/app'"

**Solution:** Make sure you installed the correct packages:

```bash
npm install firebase @angular/fire
```

---

## Firebase Free Tier Limits (Spark Plan)

| Feature | Daily/Monthly Limit |
|---------|-------------------|
| Firestore Storage | 1 GB total |
| Firestore Reads | 50,000/day |
| Firestore Writes | 20,000/day |
| Firestore Deletes | 20,000/day |
| Auth Users | 50,000/month |
| Hosting Storage | 1 GB |
| Hosting Transfer | 10 GB/month |

**Important:** Reads can add up quickly. Implement:
- Pagination for lists
- Client-side caching
- Debounced search (wait for user to stop typing)

---

## Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend-v2
vercel

# Follow prompts, link to your project
```

### Backend (Railway)

1. Push code to GitHub
2. Go to [Railway](https://railway.app)
3. "New Project" → "Deploy from GitHub repo"
4. Add environment variables in Railway dashboard
5. Deploy!

---

## Next Steps

1. ✅ Complete Firebase setup
2. ✅ Run frontend locally
3. 🔄 Implement authentication (login/register)
4. 🔄 Create customer management features
5. 🔄 Add OpenStreetMap integration
6. 🔄 Deploy to production

See [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) for detailed implementation.

---

## Useful Commands

### Frontend
```bash
ng serve             # Development server
ng build             # Production build
ng build --configuration production  # Optimized build
ng test              # Unit tests
ng e2e               # E2E tests
ng lint              # Lint code
ng generate component my-component   # Generate component
ng generate service my-service        # Generate service
```

### Backend
```bash
npm run dev          # Start with hot reload (nodemon)
npm run build        # Compile TypeScript
npm run start        # Start compiled app
npm test             # Run tests
```

---

## Resources

- [Full Refactoring Plan](./REFACTORING_PLAN.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [AngularFire Documentation](https://github.com/angular/angularfire)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Angular 19 Documentation](https://angular.dev)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Leaflet.js Documentation](https://leafletjs.com/)

---

**Questions?** Check the troubleshooting section or refer to the full refactoring plan.

**Document Version**: 2.0 (Firebase Edition)  
**Updated**: 2026-02-18
