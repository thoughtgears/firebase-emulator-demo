const admin = require("firebase-admin");

// Check if running in emulator
const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST !== undefined;
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

// Initialize Firebase Admin
if (!admin.apps.length) {
  // In emulator mode, we don't need service account credentials
  if (isEmulator) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "teamnotes-demo",
    });

    console.log("🔧 Firebase Admin initialized for EMULATOR mode");
    console.log(`  - Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`  - Firestore Emulator: ${firestoreEmulatorHost}`);
  } else {
    // In production, use Application Default Credentials or service account
    admin.initializeApp();
    console.log("🚀 Firebase Admin initialized for PRODUCTION mode");
  }

  // Configure Firestore for emulator if needed
  if (firestoreEmulatorHost) {
    const [host, port] = firestoreEmulatorHost.split(":");
    admin.firestore().settings({
      host: `${host}:${port}`,
      ssl: false,
    });
  }
}

module.exports = admin;
