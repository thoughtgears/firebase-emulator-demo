# Firebase Emulator Skill

Use this skill when working with the Firebase emulator setup in this project.

The emulator container builds `FROM ghcr.io/thoughtgears/docker-firebase-emulator`
(see `firebase/Dockerfile`). Host ports below are the emulators' real ports; the
container side of every mapping is + 1, because the image fronts every emulator with
an nginx proxy. Changing anything under `firebase/` needs `npm run dev:build`.

## Commands

### Start the emulator suite
```bash
npm run dev
```

This starts all services via Docker Compose:
- Firebase Emulator UI: http://localhost:4000
- Frontend: http://localhost:5173
- API: http://localhost:3000
- Firestore: localhost:8080
- Auth: localhost:9099
- Functions: localhost:5001

### Stop the emulator
```bash
npm run stop
```

### Clean restart (delete all data)
```bash
npm run dev:clean
```

### Rebuild containers
```bash
npm run dev:build
```

### Seed test data
```bash
npm run seed
```

Creates test users:
- alice@example.com / password123
- bob@example.com / password123
- charlie@example.com / password123

## Emulator URLs

- **Emulator UI**: http://localhost:4000 - View all emulator data
- **Authentication**: http://localhost:4000/auth - Manage test users
- **Firestore**: http://localhost:4000/firestore - Browse database
- **Functions**: http://localhost:4000/logs - View function logs

## Connecting from Services

### Frontend (Browser)
Uses `localhost` URLs since it runs in the browser:
```javascript
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);
```

### API (Docker container)
Uses service names plus the nginx ports for internal Docker networking:
```javascript
FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9100
FIRESTORE_EMULATOR_HOST=firebase-emulator:9081
```

### Functions
Automatically connects to emulator when running via `firebase emulators:start`

## Data Persistence

The stack starts **empty** on every run and the seeder repopulates it, which keeps
`docker compose up` read-only with respect to the repo working tree.

Persistence is opt-in: set `DATA_DIRECTORY=data` on the `firebase-emulator` service
and bind-mount `./firebase/data:/srv/firebase/data:rw`. The image's `serve.sh` then
adds `--import=./data/export --export-on-exit`.

## Firestore Rules

Rules are located at `firebase/firestore.rules`. They are COPYed into the image, so
run `npm run dev:build` after changing them.

Test rules in the Emulator UI: http://localhost:4000/firestore

## Cloud Functions

Functions are located in `firebase/functions/src/triggers/`

They are baked into the emulator image, so run `npm run dev:build` after changing them.

**Gotcha:** inside the Functions emulator, `admin.firestore.FieldValue` (and
`.Timestamp`, `.GeoPoint`, `.FieldPath`) are `undefined`. firebase-tools replaces the
cached `firebase-admin` module with a proxy that returns `fn.bind(target)` for
non-constructor functions, and a bound function keeps none of the original's own
properties. Import from the modular entry point instead:
`const { FieldValue } = require("firebase-admin/firestore");`

View function logs:
- Docker: `docker compose logs -f firebase-emulator`
- Emulator UI: http://localhost:4000/logs

## Common Issues

### Port already in use
```bash
# Find and kill process using port
lsof -ti:4000 | xargs kill -9
```

### Functions not triggering
1. Check function logs in Emulator UI
2. Verify Firestore rules allow the operation
3. Check that document path matches the trigger pattern

### API can't connect to emulator
Ensure you're using the correct host:
- From host machine: `localhost`
- From Docker container: `firebase-emulator`

## Architecture Note

This setup demonstrates how to run Firebase services locally for development,
mimicking a production environment where:
- Frontend → Firebase Hosting
- API → Cloud Run
- Functions → Cloud Functions
- Database → Firestore
- Auth → Firebase Auth
