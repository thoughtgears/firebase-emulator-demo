# API Development Skill

Use this skill when working with the Node.js API service.

## API Architecture

The API demonstrates how to build a Cloud Run service that:
1. Authenticates users via Firebase Auth tokens
2. Accesses Firestore data with proper permissions
3. Runs as a separate container alongside Firebase emulator

## Location

```
api/
├── src/
│   ├── config/
│   │   └── firebase-admin.js    # Firebase Admin SDK setup
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── routes/
│   │   └── user.js              # User-related endpoints
│   └── index.js                 # Express server
├── Dockerfile
└── package.json
```

## Starting the API

### Via Docker Compose (recommended)
```bash
npm run dev
```

### Standalone (for debugging)
```bash
cd api
npm install
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_PROJECT_ID=teamnotes-demo \
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

No authentication required. Returns service status.

```bash
curl http://localhost:3000/health
```

### Get User Stats
```bash
GET /api/user/stats
```

**Authentication**: Required (Bearer token)

Returns statistics about the user's notes.

```bash
# Get ID token from frontend after logging in
curl http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user-id",
    "email": "user@example.com"
  },
  "stats": {
    "totalNotes": 5,
    "notesShared": 2,
    "notesReceived": 1,
    "averageNoteLength": 150,
    "totalCharacters": 750,
    "recentNotes": [...]
  },
  "timestamp": "2026-01-30T..."
}
```

### Export User Notes
```bash
POST /api/user/export
```

**Authentication**: Required (Bearer token)

Exports all user's notes as JSON.

```bash
curl -X POST http://localhost:3000/api/user/export \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

## Authentication Flow

1. **Frontend**: User signs in with Firebase Auth
2. **Frontend**: Gets ID token via `user.getIdToken()`
3. **Frontend**: Sends token in Authorization header
4. **API**: Verifies token with Firebase Admin SDK
5. **API**: Extracts user ID from token
6. **API**: Performs authorized operations

### Getting a Token (Frontend)

```javascript
import { auth } from "./firebase";

// After user is signed in
const user = auth.currentUser;
const idToken = await user.getIdToken();

// Make API request
fetch("http://localhost:3000/api/user/stats", {
  headers: {
    Authorization: `Bearer ${idToken}`,
  },
});
```

### Verifying Token (API)

```javascript
const admin = require("firebase-admin");

// Extract token from header
const token = req.headers.authorization?.split("Bearer ")[1];

// Verify token
const decodedToken = await admin.auth().verifyIdToken(token);
const userId = decodedToken.uid;
```

## Adding New Endpoints

1. Create route handler in `api/src/routes/`
2. Use `verifyFirebaseToken` middleware for protected routes
3. Import and use in `api/src/index.js`

Example:

```javascript
// api/src/routes/notes.js
const express = require("express");
const { verifyFirebaseToken } = require("../middleware/auth");
const admin = require("../config/firebase-admin");

const router = express.Router();

router.post("/create", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { title, content } = req.body;

    const docRef = await admin.firestore().collection("notes").add({
      userId,
      title,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, noteId: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

```javascript
// api/src/index.js
const notesRoutes = require("./routes/notes");
app.use("/api/notes", notesRoutes);
```

## Middleware

### Auth Middleware (`middleware/auth.js`)

Verifies Firebase ID tokens and attaches user info to `req.user`:

```javascript
req.user = {
  uid: "user-id",
  email: "user@example.com",
  emailVerified: true,
  customClaims: {...}
};
```

## Error Handling

Standard error responses:

```json
{
  "error": "ErrorType",
  "message": "Human-readable message",
  "details": "Stack trace (development only)"
}
```

Common error codes:
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Valid token, insufficient permissions
- `404 NotFound` - Resource not found
- `500 InternalServerError` - Server error

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `FIREBASE_PROJECT_ID` | Firebase project ID | teamnotes-demo |
| `FIREBASE_AUTH_EMULATOR_HOST` | Auth emulator host | (none) |
| `FIRESTORE_EMULATOR_HOST` | Firestore emulator host | (none) |

## Logs

View API logs:

```bash
npm run logs:api
```

Or directly:

```bash
docker compose logs -f api
```

## Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Protected endpoint (requires token)
TOKEN="your-firebase-id-token"
curl http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer $TOKEN"

# POST request
curl -X POST http://localhost:3000/api/user/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Debugging

### Enable verbose logging

```javascript
// api/src/index.js
app.use(morgan("dev")); // Already enabled
```

### Debug Firebase Admin connection

```javascript
// api/src/config/firebase-admin.js
console.log("Firestore settings:", admin.firestore()._settings);
```

### Test token verification

```bash
# Get token from frontend console
const token = await auth.currentUser.getIdToken();
console.log(token);

# Verify manually
curl http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer <paste-token-here>"
```

## Security Best Practices

1. **Always verify tokens** - Use `verifyFirebaseToken` middleware
2. **Validate input** - Check request body before processing
3. **Use least privilege** - Only access data the user owns
4. **Don't expose internals** - Limit error details in production
5. **Rate limiting** - Consider adding rate limiting for production

## Cloud Run Deployment

This API is designed to be deployed to Cloud Run:

```bash
# Build container
docker build -t gcr.io/PROJECT_ID/teamnotes-api ./api

# Push to registry
docker push gcr.io/PROJECT_ID/teamnotes-api

# Deploy to Cloud Run
gcloud run deploy teamnotes-api \
  --image gcr.io/PROJECT_ID/teamnotes-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Environment variables for production:
- Remove emulator host variables
- Set `NODE_ENV=production`
- Configure service account with Firestore access
