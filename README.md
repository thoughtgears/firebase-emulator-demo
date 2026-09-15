# 📝 TeamNotes - Firebase Emulator Demo

A comprehensive demo project showcasing Firebase Emulator + Docker + Cloud Run architecture in a monorepo setup.

`firebase/Dockerfile` here builds its own emulator image (it needs a bundled `functions` directory and a different
startup contract than a reusable base image can offer) rather than extending one. It's kept in version lockstep by
hand with [thoughtgears/docker-firebase-emulator](https://github.com/thoughtgears/docker-firebase-emulator) — same
firebase-tools, same Node base, same JRE — so this repo doubles as a real-world reference for the versions and
Java requirements that image needs.

## 🎯 What This Demonstrates

- **Firebase Emulator Suite** - Local development with Auth, Firestore, Functions, and Hosting
- **Cloud Functions** - Event-driven functions triggered by Firestore changes
- **Cloud Run API** - Node.js/Express API with Firebase Auth integration
- **React Frontend** - Vite + React with Firebase SDK
- **Docker Compose** - Multi-container orchestration for local development
- **Monorepo Structure** - npm workspaces with shared dependencies
- **Hot Reload** - Instant updates for frontend, API, and functions

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    http://localhost:5173                     │
└────────────┬──────────────────────────────────┬──────────────┘
             │                                  │
             │ Firebase SDK                     │ REST API
             │ (Auth, Firestore)                │ (with token)
             │                                  │
      ┌──────▼───────────────┐          ┌──────▼──────────┐
      │  Firebase Emulator   │          │   Node.js API   │
      │                      │          │    (Express)    │
      │  • Auth (9099)       │          │                 │
      │  • Firestore (8080)  │◄─────────┤  Verifies       │
      │  • Functions (5001)  │  Admin   │  Firebase       │
      │  • Hosting (5002)    │   SDK    │  Auth tokens    │
      │  • UI (4000)         │          │                 │
      └──────────────────────┘          └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (running)
- Node.js 24+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Start all services (automatically seeds data on first run)
npm run dev
```

That's it! The project includes automatic data seeding that runs when the emulator starts with no existing data.

### Access Points

- **Frontend**: <http://localhost:5173>
- **Emulator UI**: <http://localhost:4000>
- **API**: <http://localhost:3000>
- **API Health**: <http://localhost:3000/health>

### Test Credentials

These users are automatically created on first run:

```text
alice@example.com / password123
bob@example.com / password123
charlie@example.com / password123
```

### Automatic Seeding

The project includes an automatic seeder that:

- ✅ Runs automatically when you start the stack
- ✅ Checks if data already exists before seeding
- ✅ Only seeds when the database is empty
- ✅ Creates test users and sample notes

**Manual seeding** (if needed):

```bash
npm run seed
```

## 📁 Project Structure

```text
emulator-demo/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Landing, Login, Dashboard
│   │   ├── firebase.js    # Firebase SDK setup
│   │   └── App.jsx        # Main app with routing
│   └── Dockerfile
│
├── api/                   # Node.js REST API
│   ├── src/
│   │   ├── middleware/    # Firebase Auth verification
│   │   ├── routes/        # API endpoints
│   │   └── index.js       # Express server
│   └── Dockerfile
│
├── firebase/              # Firebase emulator & functions
│   ├── functions/
│   │   └── src/
│   │       ├── triggers/  # Event-driven functions
│   │       └── index.js
│   ├── firestore.rules    # Security rules
│   └── Dockerfile
│
├── scripts/               # Utility scripts
│   └── seed-data.js       # Seed test users/notes
│
├── .claude/               # Claude Code configuration
│   ├── settings.json
│   ├── skills/            # Project-specific skills
│   └── docs/              # Documentation
│
└── docker-compose.yml     # Multi-container orchestration
```

## 🔥 Features Showcase

### 1. Firebase Authentication

- Email/password authentication
- Token-based API authentication
- User session management

```javascript
// Frontend
import { signInWithEmailAndPassword } from "firebase/auth";
await signInWithEmailAndPassword(auth, email, password);
```

### 2. Firestore Real-time Database

- CRUD operations on notes
- Real-time listeners
- Security rules enforcement

```javascript
// Frontend - Real-time listener
onSnapshot(query(collection(db, "notes"), where("userId", "==", uid)), (snapshot) => {
  // Updates automatically when data changes
});
```

### 3. Cloud Functions (Event-Driven)

Triggers automatically when notes are shared:

```javascript
// firebase/functions/src/triggers/note-shared.js
exports.onNoteShared = onDocumentWritten("notes/{noteId}", async (event) => {
  // Detect sharing changes
  // Create activity log
  // Would send notifications in production
});
```

### 4. REST API with Firebase Auth

Protected endpoints that verify Firebase tokens:

```javascript
// API
router.get("/stats", verifyFirebaseToken, async (req, res) => {
  const userId = req.user.uid; // Extracted from token
  // Return user statistics
});
```

```javascript
// Frontend
const token = await user.getIdToken();
fetch("http://localhost:3000/api/user/stats", {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 🐳 Docker Services

| Service | Ports | Purpose |
| --------- | ------- | --------- |
| firebase-emulator | 4000, 8080, 9099, 5001 | Firebase services |
| api | 3000 | REST API server |
| frontend | 5173 | Vite dev server |
| seeder | - | Auto-seeds data on startup (exits after completion) |

### Service Startup Order

1. **firebase-emulator** starts and runs health checks
2. **seeder** waits for emulator, checks if data exists, seeds if needed, then exits
3. **api** waits for emulator to be healthy
4. **frontend** waits for both emulator and API

### Commands

```bash
npm run dev              # Start all services (auto-seeds if needed)
npm run stop             # Stop all services
npm run dev:clean        # Clean restart (delete data, will auto-seed)
npm run dev:build        # Rebuild containers
npm run seed             # Manually seed test data (if needed)

npm run logs:emulator    # View emulator logs
npm run logs:api         # View API logs
npm run logs:frontend    # View frontend logs
```

## 📝 Demo Script

Perfect walkthrough for presentations:

1. **Start the stack**

   ```bash
   npm run dev
   # Data is automatically seeded on first run!
   ```

2. **Open frontend** (<http://localhost:5173>)
   - Show landing page
   - Sign in as <alice@example.com>

3. **Create a note**
   - Shows Firestore real-time updates
   - Data persists in emulator

4. **Share the note**
   - Enter <bob@example.com>
   - Triggers Cloud Function

5. **View Cloud Function logs**
   - Open <http://localhost:4000/logs>
   - Show activity log created

6. **Test the API**
   - Click "Fetch Stats from API"
   - Shows token authentication working

7. **Explore Firestore**
   - Open <http://localhost:4000/firestore>
   - Show notes collection and data structure

8. **Show security rules**
   - Try accessing another user's note (blocked)

## 🛠️ Development

### Hot Reload

All services support hot reload:

- **Frontend**: Vite HMR
- **API**: Source files mounted
- **Functions**: JavaScript hot reload

### Adding Features

#### New Cloud Function

1. Create trigger in `firebase/functions/src/triggers/`
2. Export in `firebase/functions/src/index.js`
3. Changes reload automatically

#### New API Endpoint

1. Create route in `api/src/routes/`
2. Add `verifyFirebaseToken` middleware
3. Import in `api/src/index.js`

#### New Frontend Page

1. Create component in `frontend/src/pages/`
2. Add route in `App.jsx`

### Firestore Security Rules

Rules are in `firebase/firestore.rules` and hot-reload.

Test rules at: <http://localhost:4000/firestore>

### Automatic Data Seeding

The seeder service automatically populates the emulator with test data when needed.

**How it works:**

1. Seeder waits for Firebase emulator to be healthy
2. Queries Auth emulator to check if users exist
3. If no users found → runs `scripts/seed-data.js`
4. If users exist → skips seeding (data already present)
5. Exits after completion

**Seeded data includes:**

- 3 test users (alice, bob, charlie) with password: `password123`
- Sample notes for each user
- One shared note demonstrating the Cloud Function trigger

**Environment handling:**

The seed script adapts to its environment:

- **In Docker**: Uses `firebase-emulator:8080` (service name)
- **Locally**: Uses `localhost:8080` (when running `npm run seed` directly)

This is controlled via environment variables in `docker-compose.yml`:

```yaml
environment:
  - FIRESTORE_EMULATOR_HOST=firebase-emulator:8080
  - FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9099
```

**Viewing seeder logs:**

```bash
docker-compose logs seeder
```

## 🎓 Learning Resources

### Claude Code Configuration

This project includes:

- **Settings** (`.claude/settings.json`) - Project configuration
- **Skills** (`.claude/skills/`) - Context-specific guides
  - `firebase-emulator.md` - Emulator commands and tips
  - `monorepo-structure.md` - Project structure guide
  - `api-development.md` - API development guide
  - `docker-operations.md` - Docker commands
- **Docs** (`.claude/docs/`) - Quick start guides

### Key Files to Explore

- **Frontend Firebase Setup**: `frontend/src/firebase.js`
- **Auth Middleware**: `api/src/middleware/auth.js`
- **Cloud Function**: `firebase/functions/src/triggers/note-shared.js`
- **Security Rules**: `firebase/firestore.rules`
- **Docker Orchestration**: `docker-compose.yml`

## 🔒 Security

### Firestore Rules

```javascript
// Users can only read/write their own notes
allow read: if isOwner(resource.data.userId) ||
               hasSharedAccess(resource.data);
allow write: if isOwner(resource.data.userId);
```

### API Authentication

All protected endpoints verify Firebase ID tokens:

```javascript
const decodedToken = await admin.auth().verifyIdToken(token);
// Token verified, user authenticated
```

## 🌐 Production Deployment

### Firebase

```bash
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

### API (Cloud Run)

```bash
gcloud run deploy teamnotes-api \
  --source ./api \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## 🐛 Troubleshooting

### Ports in use

```bash
lsof -ti:4000 | xargs kill -9
```

### Services won't start

```bash
docker-compose logs firebase-emulator
docker-compose ps
```

### Clean slate

```bash
npm run dev:clean
rm -rf firebase/data
npm run dev
npm run seed
```

### Functions not triggering

1. Check function logs at <http://localhost:4000/logs>
2. Verify trigger path matches document path
3. Check Firestore rules allow the operation

## 📚 Additional Documentation

- [Quick Start Guide](.claude/docs/quick-start.md)
- [Firebase Emulator Guide](.claude/skills/firebase-emulator.md)
- [API Development Guide](.claude/skills/api-development.md)
- [Monorepo Structure](.claude/skills/monorepo-structure.md)
- [Docker Operations](.claude/skills/docker-operations.md)

## 💡 Use Cases

This architecture is perfect for:

- **SaaS applications** with multi-tenant data
- **Mobile backends** with real-time features
- **Event-driven workflows** with Cloud Functions
- **Microservices** with separate API and functions
- **Local development** that mirrors production

## 🤝 Contributing

This is a demo project for ThoughtGears. Feel free to:

- Fork and customize
- Report issues
- Suggest improvements
- Use as a template

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:

- Firebase Emulator Suite
- Docker & Docker Compose
- React + Vite
- Node.js + Express
- Firebase Admin SDK

---

**Made with ❤️ by ThoughtGears**

For questions or support, open an issue on GitHub.
