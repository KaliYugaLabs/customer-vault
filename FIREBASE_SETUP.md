# Firebase MCP Setup - Complete Configuration

## 🚀 Quick Setup

### Option 1: Automated Setup Script

**Mac/Linux:**
```bash
chmod +x scripts/setup-firebase.sh
./scripts/setup-firebase.sh
```

**Windows:**
```cmd
scripts\setup-firebase.bat
```

### Option 2: Manual Setup

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Project**
   ```bash
   firebase init
   # Select: Firestore, Hosting, Emulators
   # Use existing project or create new
   ```

4. **Deploy Configuration**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

## 📁 Firebase Configuration Files Created

### 1. `.firebaserc`
Firebase project configuration - links to your Firebase project

### 2. `firebase.json`
Firebase services configuration including:
- Firestore rules and indexes paths
- Hosting configuration
- Emulator settings

### 3. `firestore.rules`
Database security rules with:
- User authentication required
- User data isolation
- Input validation
- ID number validation (13 digits)
- Email validation

### 4. `firestore.indexes.json`
Database query optimization indexes

### 5. `mcp.json`
Model Context Protocol configuration

## 🔧 Environment Configuration

### Development
File: `frontend-v2/src/environments/environment.ts`

Update with your Firebase config values from Firebase Console.

### Production
File: `frontend-v2/src/environments/environment.prod.ts`

Uses environment variables for security.

## 📊 Firestore Data Structure

### Collection: users
- email: string
- displayName: string
- createdAt: timestamp
- role: string

### Collection: customers
- idNumber: string (13 digits)
- firstName: string
- lastName: string
- email: string
- phone: string or null
- address: string
- formattedAddress: string or null
- latitude: number or null
- longitude: number or null
- createdBy: string (User UID)
- createdAt: timestamp
- updatedAt: timestamp

## 🔒 Security Rules Features

1. Authentication Required - All operations need valid user
2. User Isolation - Users only access their own data
3. Input Validation:
   - ID Number: exactly 13 digits
   - Email: valid format
   - Names: 1-100 characters
   - Address: 5-500 characters

## 🛠️ Firebase Services

### Authentication
Provider: Email/Password
Features: Registration, Login, Password reset, Session management

### Firestore
Mode: Production
Location: us-central
Features: Real-time updates, Offline persistence, Security rules

### Emulators (Development)
- Auth: Port 9099
- Firestore: Port 8080
- Hosting: Port 5000
- UI: Port 4000

## 🧪 Testing with Emulators

```bash
# Start emulators
firebase emulators:start

# Run with emulators
firebase emulators:exec "npm start"
```

## 📦 Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy Firestore only
firebase deploy --only firestore

# Deploy rules only
firebase deploy --only firestore:rules

# Deploy hosting only
firebase deploy --only hosting
```

## 🔍 Troubleshooting

### Permission Denied
Check that user is authenticated and owns the data

### Invalid Data
Verify data matches schema in security rules

### Index Missing
Run: firebase deploy --only firestore:indexes

### API Key Invalid
Update environment.ts with correct Firebase config

## 🎯 Next Steps

1. Run setup script: ./scripts/setup-firebase.sh
2. Install dependencies: cd frontend-v2 && npm install
3. Start development: npm start
4. Open: http://localhost:4200

## 📚 Resources

- Firebase Documentation: https://firebase.google.com/docs
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- AngularFire: https://github.com/angular/angularfire
- Firebase CLI: https://firebase.google.com/docs/cli

---

**All Firebase configuration files are ready!**

Run the setup script to configure your Firebase project automatically.
