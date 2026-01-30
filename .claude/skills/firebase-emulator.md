# Firebase Emulator Skill

Use this skill when working with the Firebase emulator setup in this project.

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
Uses service names for internal Docker networking:
```javascript
FIREBASE_AUTH_EMULATOR_HOST=firebase-emulator:9099
FIRESTORE_EMULATOR_HOST=firebase-emulator:8080
```

### Functions
Automatically connects to emulator when running via `firebase emulators:start`

## Data Persistence

Emulator data is stored in `firebase/data/` and persists between restarts.

To export current data manually:
```bash
firebase emulators:export firebase/data --project teamnotes-demo
```

To import data:
```bash
firebase emulators:start --import=firebase/data --project teamnotes-demo
```

## Firestore Rules

Rules are located at `firebase/firestore.rules` and are hot-reloaded.

Test rules in the Emulator UI: http://localhost:4000/firestore

## Cloud Functions

Functions are located in `firebase/functions/src/triggers/`

They hot-reload when you modify JavaScript files.

View function logs:
- Docker: `docker-compose logs -f firebase-emulator`
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
