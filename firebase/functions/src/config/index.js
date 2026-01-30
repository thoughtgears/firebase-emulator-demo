const { defineString } = require("firebase-functions/params");

// Environment detection
const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
const projectId = process.env.GCLOUD_PROJECT || "teamnotes-demo";

// Function configuration defaults
const defaultFunctionOptions = {
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB",
};

// Firestore configuration for emulator
const firestoreHost = isEmulator ? "firebase-emulator:8080" : undefined;

// Export configuration
module.exports = {
  projectId,
  isEmulator,
  firestoreHost,
  defaultFunctionOptions,

  // Function-specific configurations
  functions: {
    onNoteShared: {
      ...defaultFunctionOptions,
      timeoutSeconds: 30,
    },
  },
};
