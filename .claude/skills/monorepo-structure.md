# Monorepo Structure Skill

Use this skill when navigating or modifying the monorepo structure.

## Project Structure

```
emulator-demo/
├── .claude/                    # Claude Code configuration
│   ├── settings.json          # Project settings
│   ├── skills/                # Claude skills for this project
│   └── docs/                  # Project documentation
│
├── .vscode/                   # VSCode configuration
│   ├── extensions.json        # Recommended extensions
│   └── settings.json          # Editor settings
│
├── frontend/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/            # Page components (Landing, Login, Dashboard)
│   │   ├── components/       # Reusable components (future)
│   │   ├── styles/           # CSS files
│   │   ├── firebase.js       # Firebase SDK initialization
│   │   ├── App.jsx           # Main app component with routing
│   │   └── main.jsx          # Entry point
│   ├── Dockerfile            # Development container
│   └── package.json          # Frontend dependencies
│
├── api/                       # Node.js API (Express)
│   ├── src/
│   │   ├── config/           # Configuration (Firebase Admin)
│   │   ├── middleware/       # Auth middleware
│   │   ├── routes/           # API routes (user.js)
│   │   └── index.js          # Express server
│   ├── Dockerfile            # Production container
│   └── package.json          # API dependencies
│
├── firebase/                  # Firebase emulator & functions
│   ├── functions/
│   │   ├── src/
│   │   │   ├── config/       # Function configuration
│   │   │   ├── triggers/     # Event-driven functions
│   │   │   ├── utils/        # Utilities (logger)
│   │   │   └── index.js      # Functions entry point
│   │   └── package.json      # Functions dependencies
│   ├── Dockerfile            # Emulator container
│   ├── firebase.json         # Firebase configuration
│   ├── .firebaserc           # Project aliases
│   ├── firestore.rules       # Security rules
│   ├── firestore.indexes.json # Database indexes
│   ├── serve.sh              # Emulator startup script
│   └── data/                 # Persistent emulator data (gitignored)
│
├── scripts/                   # Utility scripts
│   └── seed-data.js          # Seed test users and notes
│
├── docker-compose.yml         # Multi-container orchestration
├── package.json              # Root workspace configuration
└── README.md                 # Project documentation
```

## Workspace Configuration

This is an npm workspace monorepo. Root `package.json` declares workspaces:

```json
{
  "workspaces": [
    "frontend",
    "api",
    "firebase/functions"
  ]
}
```

## Installing Dependencies

### All workspaces
```bash
npm install
```

### Specific workspace
```bash
npm install --workspace=frontend <package>
npm install --workspace=api <package>
npm install --workspace=firebase/functions <package>
```

## Running Commands

### From root
```bash
npm run dev              # Start all services
npm run seed             # Seed test data
npm run lint:functions   # Lint Cloud Functions
```

### In specific workspace
```bash
cd frontend && npm run dev
cd api && npm start
cd firebase/functions && npm run lint
```

## Adding New Services

To add a new service to the monorepo:

1. Create service directory
2. Add `package.json` with a name
3. Add to root `package.json` workspaces array
4. Create Dockerfile if needed
5. Add service to `docker-compose.yml`
6. Update this documentation

## Key Files

### Frontend
- **firebase.js** - Firebase SDK setup with emulator connection
- **App.jsx** - React Router setup and auth state management
- **pages/Dashboard.jsx** - Main app functionality (CRUD operations)

### API
- **middleware/auth.js** - Firebase Auth token verification
- **routes/user.js** - Protected API endpoints
- **config/firebase-admin.js** - Admin SDK initialization

### Functions
- **triggers/note-shared.js** - Event-driven function for note sharing
- **config/index.js** - Function configuration and environment detection
- **utils/logger.js** - Structured logging utility

### Firebase
- **firebase.json** - Emulator ports and function runtime configuration
- **firestore.rules** - Database security rules
- **serve.sh** - Emulator startup with signal handling

## Development Workflow

1. **Start services**: `npm run dev`
2. **Seed data**: `npm run seed` (in another terminal)
3. **Open frontend**: http://localhost:5173
4. **View emulator**: http://localhost:4000
5. **Make changes**: Hot reload enabled for all services
6. **View logs**: `npm run logs:api` or `npm run logs:emulator`

## Docker Volumes

Named volumes for performance:
- `firebase_functions_node_modules`
- `frontend_node_modules`

These prevent node_modules from being synced on Mac/Windows, improving performance.

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| API | 3000 | http://localhost:3000 |
| Emulator UI | 4000 | http://localhost:4000 |
| Firestore | 8080 | localhost:8080 |
| Auth | 9099 | localhost:9099 |
| Functions | 5001 | localhost:5001 |
| Hosting | 5002 | localhost:5002 |

## Best Practices

1. **Don't commit `node_modules/`** - Managed by Docker volumes
2. **Don't commit `firebase/data/`** - Local emulator data
3. **Use npm workspaces** - For cross-workspace dependencies
4. **Keep Dockerfiles simple** - Optimize for development speed
5. **Use named volumes** - For node_modules in Docker
6. **Document changes** - Update this file when structure changes
