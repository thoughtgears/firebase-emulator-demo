import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Firebase configuration from environment variables
// Vite exposes env vars prefixed with VITE_
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connect to emulators based on environment variable
const useEmulator = import.meta.env.VITE_USE_EMULATOR === "true";

if (useEmulator) {
  console.log("🔧 Connecting to Firebase Emulators...");

  const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || "localhost";

  // Connect to Auth emulator
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });

  // Connect to Firestore emulator
  connectFirestoreEmulator(db, emulatorHost, 8080);

  // Connect to Functions emulator
  connectFunctionsEmulator(functions, emulatorHost, 5001);

  console.log(`✅ Connected to Firebase Emulators at ${emulatorHost}`);
}

export default app;
