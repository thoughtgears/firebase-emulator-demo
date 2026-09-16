# 📝 TeamNotes - Firebase Emulator Demo

A comprehensive demo project showcasing Firebase Emulator + Docker + Cloud Run architecture in a monorepo setup.

## Relationship to `docker-firebase-emulator`

The emulator in this stack **is**
[thoughtgears/docker-firebase-emulator](https://github.com/thoughtgears/docker-firebase-emulator).
[`firebase/Dockerfile`](firebase/Dockerfile) is four lines of `COPY` on top of
`FROM ghcr.io/thoughtgears/docker-firebase-emulator:15.30.1` — it adds this project's
`firebase.json`, security rules, indexes and `functions/` directory at `/srv/firebase`,
and inherits everything else: Node 24 on Alpine, the JRE the Firestore emulator needs,
firebase-tools, the nginx proxy, and the `serve.sh` entrypoint.

Nothing about running the emulator is reimplemented here. That is deliberate and it cuts
both ways: this repo is the image's worked example *and* its integration test. If a new
version of the image breaks its own startup contract, `docker compose up` in this repo
fails, and we find out before anyone else does.

Two things follow from consuming the image, and they are the two things most likely to
trip you up if you copy this setup:

- **Every port is offset by one on the container side.** nginx inside the image listens
  on `<emulator port> + 1` and proxies down to the emulator, which binds `127.0.0.1`.
  So compose maps `8080:8081`, `9099:9100` and so on, and services on the compose network
  dial the `+1` port. See [Ports](#-ports) below.
- **The image version is pinned, in one place.** The `FROM` line in `firebase/Dockerfile`
  is the only version declaration. The image publishes a version tag and `main` but
  no `latest`, so bump that line (and the table in this README) deliberately.

## 🎯 What This Demonstrates

- **Firebase Emulator Suite** - Local development with Auth, Firestore and Functions, served by the
  published [`docker-firebase-emulator`](https://github.com/thoughtgears/docker-firebase-emulator) image
- **Cloud Functions** - Event-driven functions triggered by Firestore changes
- **Cloud Run API** - Node.js/Express API with Firebase Auth integration
- **React Frontend** - Vite + React with Firebase SDK
- **Docker Compose** - Multi-container orchestration for local development
- **Monorepo Structure** - npm workspaces with shared dependencies
- **Hot Reload** - Instant updates for the frontend and API

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
      │ docker-firebase-     │          │   Node.js API   │
      │ emulator image       │          │    (Express)    │
      │ ┌──────────────────┐ │          │                 │
      │ │ nginx (port + 1) │ │◄─────────┤  Verifies       │
      │ └────────┬─────────┘ │  Admin   │  Firebase       │
      │  • Auth (9099)       │   SDK    │  Auth tokens    │
      │  • Firestore (8080)  │          │                 │
      │  • Functions (5001)  │          │                 │
      │  • UI (4000)         │          │                 │
      └──────────────────────┘          └─────────────────┘
```

Everything inside the emulator box comes from the published image; only the
`firebase.json`, rules and `functions/` inside it belong to this repo.

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

## 🔌 Ports

The emulator container runs the `docker-firebase-emulator` image, whose nginx proxy
listens on each emulator's real port **+ 1** and proxies back down to the emulator
(which binds `127.0.0.1`). So the container side of every mapping is `+ 1`, while the
host side stays equal to the emulator's real port — which is what the Emulator UI
tells a browser to connect to.

| Emulator | Host | Container (nginx) | Who uses it |
| --- | --- | --- | --- |
| Emulator UI | 4000 | 4001 | Browser; the compose health check |
| Hub | 4400 | 4401 | firebase-tools |
| Logging | 4600 | 4601 | Emulator UI logs tab |
| Cloud Functions | 5001 | 5002 | Browser (callables) |
| Firestore (HTTP) | 8080 | 8081 | Browser, via the Firebase JS SDK |
| Firestore (gRPC) | 8082 | 9081 | `api` + `seeder`, via the Admin SDK |
| Auth | 9099 | 9100 | Browser and `api` + `seeder` |

Services on the compose network talk to the **container** ports, because the emulators
themselves are only bound on loopback inside their container:

```yaml
FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9100
FIRESTORE_EMULATOR_HOST=firebase-emulator:9081   # gRPC: the Admin SDK's transport
```

The full port table for the emulators this demo does not enable (pubsub, database,
storage, hosting) is in the
[image's README](https://github.com/thoughtgears/docker-firebase-emulator#docker-compose).

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

| Service | Host ports | Purpose |
| --------- | ------- | --------- |
| firebase-emulator | 4000, 4400, 4600, 5001, 8080, 8082, 9099 | `docker-firebase-emulator` image + this repo's Firebase project |
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
npm run dev:clean        # Remove containers and named volumes
npm run dev:build        # Rebuild containers (needed after editing functions/)
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

- **Frontend**: Vite HMR (source is bind-mounted)
- **API**: Source files bind-mounted
- **Functions**: **no** hot reload — run `npm run dev:build` after editing
  `firebase/functions/`

Functions source is baked into the emulator image rather than bind-mounted, and that is
on purpose. Bind-mounting it means the container's `npm install` writes `node_modules`
and a lockfile back onto your working tree; the alternative — a named volume for
`node_modules` — is worse, because docker-compose creates that volume as an *empty
directory* before the entrypoint runs, which is exactly how this repo once shipped a
Functions emulator that came up with no `firebase-functions` installed and failed
silently. Installing from a committed lockfile at image build time has neither failure
mode, at the cost of a rebuild when you change function code.

### Adding Features

#### New Cloud Function

1. Create trigger in `firebase/functions/src/triggers/`
2. Export in `firebase/functions/src/index.js`
3. `npm run dev:build` to rebuild the emulator image

> **Writing triggers:** use `require("firebase-admin/firestore")` for `FieldValue`,
> `Timestamp`, `GeoPoint` and `FieldPath` rather than reading them off
> `admin.firestore`. The Functions emulator replaces the cached `firebase-admin`
> module with a proxy that returns `fn.bind(target)` for non-constructor functions, and
> a bound function drops the original's own properties — so `admin.firestore.FieldValue`
> is `undefined` inside the emulator even though it works fine under plain `node`. See
> the comment in `firebase/functions/src/triggers/note-shared.js`.

#### New API Endpoint

1. Create route in `api/src/routes/`
2. Add `verifyFirebaseToken` middleware
3. Import in `api/src/index.js`

#### New Frontend Page

1. Create component in `frontend/src/pages/`
2. Add route in `App.jsx`

### Firestore Security Rules

Rules are in `firebase/firestore.rules`. They are copied into the image, so rebuild
(`npm run dev:build`) after changing them.

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

**Persistence (opt-in):** the stack deliberately starts empty each run, so that `docker
compose up` stays read-only with respect to your working tree. The image supports
`--import` / `--export-on-exit` via its `DATA_DIRECTORY` variable; to use it, set
`DATA_DIRECTORY=data` on the `firebase-emulator` service and bind-mount a writable
`./firebase/data:/srv/firebase/data`. That directory is gitignored.

**Environment handling:**

The seed script adapts to its environment:

- **In Docker**: uses the service name and the nginx ports (`+ 1`), because the
  emulators bind `127.0.0.1` inside their container
- **Locally**: uses `localhost:8080` / `localhost:9099` (when running `npm run seed`
  directly against the host port mappings)

This is controlled via environment variables in `docker-compose.yml`:

```yaml
environment:
  - FIRESTORE_EMULATOR_HOST=firebase-emulator:9081   # 8080 + nginx gRPC offset
  - FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9100 # 9099 + 1
```

**Viewing seeder logs:**

```bash
docker compose logs seeder
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
firebase deploy --only firestore:rules
```

### API (Cloud Run)

```bash
gcloud run deploy teamnotes-api \
  --source ./api \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend

The demo serves the frontend from the Vite dev server, so `firebase/firebase.json`
carries no `hosting` block — add one (and run `npm run build` in `frontend/` first) if
you want to deploy it to Firebase Hosting. Note that if you also want the *hosting
emulator*, it has to stay off its default proxy collision: the
`docker-firebase-emulator` image's nginx already listens on 5002 (Cloud Functions
`5001 + 1`), so give the hosting emulator its documented 6000 and map `6000:6001`.

## 🐛 Troubleshooting

### Ports in use

```bash
lsof -ti:4000 | xargs kill -9
```

### Services won't start

```bash
docker compose logs firebase-emulator
docker compose ps
```

### Clean slate

```bash
npm run dev:clean   # docker compose down -v
npm run dev:build
```

`docker compose up` never writes to the repo working tree, so there is nothing else to
clean up: the emulator starts empty every run and the seeder repopulates it.

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
