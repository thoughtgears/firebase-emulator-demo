const admin = require("firebase-admin");
const config = require("./config");

// Initialize Firebase Admin SDK
// Configure Firestore to use emulator if running locally
const firestoreSettings = config.firestoreHost
  ? { host: config.firestoreHost, ssl: false }
  : {};

admin.initializeApp();

if (config.firestoreHost) {
  admin.firestore().settings(firestoreSettings);
  console.log(`Firestore configured for emulator: ${config.firestoreHost}`);
}

// Export all triggers
const { onNoteShared } = require("./triggers/note-shared");

exports.onNoteShared = onNoteShared;
