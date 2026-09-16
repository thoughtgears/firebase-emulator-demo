const admin = require("firebase-admin");

// Initialize Firebase Admin SDK.
//
// No emulator wiring is needed here. The Functions emulator sets
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST in the runtime's
// environment before this file is loaded, and the Admin SDK reads those
// itself. Pointing Firestore at a host explicitly would be wrong as well as
// redundant: the emulators bind 127.0.0.1 inside the container (everything
// reaching them from outside goes through the base image's nginx proxy),
// so the only address that resolves from in here is the loopback one the
// emulator already handed us.
admin.initializeApp();

// Export all triggers
const { onNoteShared } = require("./triggers/note-shared");

exports.onNoteShared = onNoteShared;
