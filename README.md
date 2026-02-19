<p align="center">
  <h1 align="center">🏢 Customer Manager</h1>
  <p align="center">
    A modern, full-stack customer management platform built with <strong>Angular 19</strong>, <strong>Firebase</strong>, and <strong>OpenStreetMap</strong>.
    <br />
    Manage customers, verify identities, and geocode addresses — all for <strong>$0/month</strong>.
  </p>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

| Category | What You Get |
|----------|-------------|
| **Authentication** | Email/password registration & login, password reset, session persistence, route guards |
| **Customer CRUD** | Create, view, edit, and delete customers with full validation |
| **Data Isolation** | Each user only sees their own customers — enforced at the database level |
| **Address Autocomplete** | Free geocoding via OpenStreetMap Nominatim with coordinate extraction |
| **ID Validation** | South African ID number validation (13-digit format) |
| **Modern UI** | Angular Material 19 with responsive layout, loading states, toast notifications |
| **Security** | Firestore rules, JWT auth, rate limiting, Helmet headers, CORS, XSS protection |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Frontend  (Angular 19)                     │
│  • Firebase SDK v11 (@angular/fire)                          │
│  • Angular Material v19                                      │
│  • Firestore real-time queries                               │
│  • Leaflet + OpenStreetMap Nominatim (free geocoding)        │
│  • Signals + RxJS 7 reactivity                               │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────────────┐
│          Optional Backend  (Express + TypeScript)             │
│  • Firebase Admin SDK     • Rate limiting                    │
│  • Geocoding proxy        • Helmet + CORS                    │
│  • Zod validation         • dotenv config                    │
└──────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                   Firebase (Spark — Free)                     │
│  • Authentication (email/password)                           │
│  • Cloud Firestore (NoSQL database)                          │
│  • Hosting & Emulators                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 19.x | SPA framework (standalone components) |
| Angular Material | 19.x | UI component library |
| Firebase SDK | 11.x | Auth & Firestore client |
| Leaflet | 1.9.x | Interactive maps |
| RxJS | 7.x | Reactive programming |
| Zod | 3.x | Runtime schema validation |
| TypeScript | 5.6 | Type safety |

### Backend (Optional)
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.21.x | HTTP framework |
| Firebase Admin | 12.x | Server-side Firebase |
| Helmet | 8.x | Security headers |
| express-rate-limit | 7.x | API rate limiting |
| Zod | 3.x | Input validation |
| TypeScript | 5.6 | Type safety |

---

## 📁 Project Structure

```
ng-node-firebase/
├── frontend-v2/                # Angular 19 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── auth/       # Login & Register pages
│   │   │   │   ├── customers/  # Customer list & form
│   │   │   │   ├── layout/     # App layout, 404 page
│   │   │   │   └── shared/     # Reusable components
│   │   │   ├── services/       # Auth, Customer, Geocoding
│   │   │   ├── models/         # TypeScript interfaces
│   │   │   ├── guards/         # Route guards
│   │   │   └── interceptors/   # HTTP interceptors
│   │   └── environments/       # Firebase config (per env)
│   └── package.json
│
├── backend-v2/                 # Express API (optional)
│   └── src/
│       ├── config/             # Firebase Admin init
│       ├── middleware/          # Security middleware
│       ├── services/           # Geocoding service
│       ├── routes/             # API routes
│       ├── models/             # Data models
│       ├── validation/         # Zod schemas
│       └── app.ts              # Entry point
│
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Composite indexes
├── firebase.json               # Firebase project config
└── docs/                       # Additional documentation
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** — [download](https://nodejs.org/)
- **Firebase account** — [sign up free](https://firebase.google.com/)

### 1. Clone & Install

```bash
git clone https://github.com/KaliYugaLabs/ng-node-firebase.git
cd ng-node-firebase

# Install frontend dependencies
cd frontend-v2 && npm install
```

### 2. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Firestore Database** (production mode, `us-central`)
3. Enable **Authentication → Email/Password** sign-in
4. Register a **Web App** and copy the config object

### 3. Configure Environment

Edit `frontend-v2/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  },
  apiUrl: 'http://localhost:3000/api/v1',
  nominatimUrl: 'https://nominatim.openstreetmap.org'
};
```

### 4. Deploy Firestore Rules

```bash
# From project root
firebase login
firebase deploy --only firestore:rules
```

### 5. Run

```bash
# From project root
npm start
# → opens http://localhost:4200
```

### 6. Backend (Optional)

Only needed to proxy geocoding requests:

```bash
cd backend-v2
npm install
cp .env.example .env
# Edit .env with your Firebase service account JSON
npm run dev
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start frontend dev server |
| `npm run build` | Production build |
| `npm run build:prod` | Optimized production build |
| `npm test` | Run unit tests |
| `npm run start:backend` | Start backend with hot reload |
| `npm run emulators` | Start Firebase emulators |
| `npm run deploy:all` | Deploy everything to Firebase |
| `npm run deploy:rules` | Deploy Firestore rules only |
| `npm run deploy:hosting` | Deploy hosting only |

---

## 💰 Cost Comparison

| | Old Stack | New Stack |
|-|-----------|-----------|
| Maps | Google Maps API — $50-100/mo | OpenStreetMap — **$0** |
| Database | Realtime DB — $0-20/mo | Firestore Spark — **$0** |
| Search | Elasticsearch — $29-79/mo | Firestore queries — **$0** |
| Auth | Firebase Auth — $0 | Firebase Auth — **$0** |
| **Total** | **$79-199/mo** | **$0/mo** ✅ |

> **Firebase Spark plan limits:** 1 GB storage, 50K reads/day, 20K writes/day, 50K MAUs — more than enough for small-to-medium apps.

---

## 🛡️ Security

- **Firestore Rules** — document-level access control with data validation
- **User Isolation** — users can only read/write their own customers
- **JWT Authentication** — Firebase ID token verification
- **Rate Limiting** — 100 requests per 15 minutes
- **Security Headers** — Helmet.js with HSTS, XSS filter, content-type sniffing prevention
- **CORS** — origin-restricted cross-origin requests
- **Input Validation** — Zod schemas on both client and server

---

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
npm run build:prod
npm run deploy:hosting
```

### Vercel (Frontend)

```bash
cd frontend-v2
npx vercel
```

### Railway / Render (Backend)

Push to GitHub → connect repo → add environment variables → deploy.

---

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| `auth/invalid-api-key` | Check Firebase config values in `environment.ts` |
| `Missing or insufficient permissions` | Verify Firestore rules are deployed and you're logged in |
| Address autocomplete not working | Nominatim rate limit is 1 req/sec — wait and retry |
| `Port 4200 already in use` | Run `npx kill-port 4200` or use `ng serve --port 4201` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/awesome`
3. Commit your changes — `git commit -m 'Add awesome feature'`
4. Push to the branch — `git push origin feature/awesome`
5. Open a Pull Request

---

## 📄 License

MIT License — free for personal and commercial use.

---

## 🙏 Credits

- Originally forked from [rikusv/ng-node-firebase](https://github.com/rikusv/ng-node-firebase)
- Modernized to Angular 19 + Firebase v11 + Firestore
- Free geocoding by [OpenStreetMap](https://www.openstreetmap.org/)

---

<p align="center"><strong>Built with ❤️ by <a href="https://github.com/KaliYugaLabs">KaliYugaLabs</a></strong></p>
