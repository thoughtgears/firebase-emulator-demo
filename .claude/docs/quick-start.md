# TeamNotes Demo - Quick Start Guide

## Prerequisites

- Docker Desktop installed and running
- Node.js 24+ installed
- npm 10+ installed
- Git (optional)

## Setup

1. **Clone or open the project**
   ```bash
   cd emulator-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start all services**
   ```bash
   npm run dev
   ```

   This starts:
   - Firebase Emulator (ports 4000, 5001, 8080, 9099)
   - API Server (port 3000)
   - Frontend (port 5173)

4. **Seed test data** (in a new terminal)
   ```bash
   npm run seed
   ```

   Creates test users:
   - alice@example.com / password123
   - bob@example.com / password123
   - charlie@example.com / password123

5. **Open the app**
   - Frontend: http://localhost:5173
   - Emulator UI: http://localhost:4000
   - API: http://localhost:3000

## First Steps

1. Sign in with alice@example.com / password123
2. View your notes on the dashboard
3. Create a new note
4. Share a note with bob@example.com
5. Check the Emulator UI to see the triggered Cloud Function
6. Click "Fetch Stats from API" to test the API endpoint

## Architecture Overview

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       v                 v
┌──────────────┐  ┌──────────────┐
│   Firebase   │  │  Node.js API │
│   Emulator   │  │   (Express)  │
│              │  │              │
│ • Auth       │  │ Verifies     │
│ • Firestore  │◄─┤ Firebase     │
│ • Functions  │  │ tokens       │
│ • Hosting    │  │              │
└──────────────┘  └──────────────┘
```

## What You Can Demo

1. **Firebase Auth** - Email/password authentication
2. **Firestore** - Real-time database with security rules
3. **Cloud Functions** - Event-driven functions (onNoteShared)
4. **REST API** - Synchronous operations with Firebase Auth
5. **Docker** - Multi-container development environment
6. **Monorepo** - Workspace structure with shared dependencies

## Common Tasks

### View logs
```bash
npm run logs:api          # API logs
npm run logs:emulator     # Emulator logs
npm run logs:frontend     # Frontend logs
```

### Restart services
```bash
npm run stop              # Stop all
npm run dev               # Start again
```

### Clean restart
```bash
npm run dev:clean         # Removes all data and volumes
```

### Rebuild containers
```bash
npm run dev:build         # Rebuild and start
```

## Troubleshooting

### Ports in use
```bash
lsof -ti:4000 | xargs kill -9   # Kill process on port 4000
```

### Services won't start
```bash
docker-compose logs firebase-emulator
docker-compose ps
```

### Changes not reflecting
- Frontend & API: Changes auto-reload
- Functions: Changes auto-reload (JavaScript only)
- Rules: Changes auto-apply

### Clean slate
```bash
npm run dev:clean
rm -rf firebase/data
npm run dev
npm run seed
```

## Next Steps

- Read [firebase-emulator.md](../skills/firebase-emulator.md) for Firebase emulator details
- Read [api-development.md](../skills/api-development.md) for API development guide
- Read [monorepo-structure.md](../skills/monorepo-structure.md) for project structure
- Explore the code with Claude Code assistance

## Demo Script

Perfect for showing to others:

1. **Show the landing page** (http://localhost:5173)
2. **Sign in** with alice@example.com
3. **Create a note** - Show Firestore real-time updates
4. **Share the note** with bob@example.com
5. **Open Emulator UI** (http://localhost:4000/logs) - Show Cloud Function triggered
6. **Click "Fetch Stats"** - Show API auth working
7. **Open Firestore tab** - Show data structure
8. **Open Functions logs** - Show event processing
9. **Sign out and sign in as bob@example.com** - Show shared note

## Project Goals

This demo showcases:
- ✅ Local Firebase development with emulator
- ✅ Cloud Run API with Firebase Auth integration
- ✅ Event-driven Cloud Functions
- ✅ React frontend with Firebase SDK
- ✅ Docker multi-container setup
- ✅ Monorepo structure
- ✅ Hot reload for rapid development
