#!/usr/bin/env node

/**
 * Seed script for TeamNotes demo
 *
 * Creates test users and sample notes in Firebase emulator
 * Run with: npm run seed
 *
 * Prerequisites:
 * - Firebase emulator must be running
 * - Run this from the project root
 */

const admin = require("firebase-admin");

// Configure for emulator (use environment variables if set, otherwise default to localhost)
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";

console.log(`Using Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`Using Auth emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

// Initialize Firebase Admin
admin.initializeApp({
  projectId: "teamnotes-demo",
});

const db = admin.firestore();
const auth = admin.auth();

// Test users to create
const TEST_USERS = [
  {
    email: "alice@example.com",
    password: "password123",
    displayName: "Alice Johnson",
  },
  {
    email: "bob@example.com",
    password: "password123",
    displayName: "Bob Smith",
  },
  {
    email: "charlie@example.com",
    password: "password123",
    displayName: "Charlie Brown",
  },
];

// Sample notes for each user
const SAMPLE_NOTES = {
  "alice@example.com": [
    {
      title: "Welcome to TeamNotes",
      content:
        "This is your first note! You can create, edit, and share notes with other users.",
    },
    {
      title: "Project Ideas",
      content:
        "1. Build a todo app\n2. Create a blog\n3. Design a portfolio site",
    },
    {
      title: "Meeting Notes - January 2026",
      content:
        "Discussed Q1 goals and team objectives. Action items: Review architecture, implement new features, schedule follow-up.",
    },
  ],
  "bob@example.com": [
    {
      title: "Docker Commands Cheatsheet",
      content:
        "docker-compose up: Start services\ndocker-compose down: Stop services\ndocker-compose logs: View logs",
    },
    {
      title: "Grocery List",
      content: "Milk, Bread, Eggs, Coffee, Bananas",
    },
  ],
  "charlie@example.com": [
    {
      title: "Book Recommendations",
      content:
        "1. Clean Code by Robert Martin\n2. The Pragmatic Programmer\n3. Designing Data-Intensive Applications",
    },
  ],
};

async function createUser(userData) {
  try {
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(userData.email);
      console.log(`✓ User already exists: ${userData.email} (${existingUser.uid})`);
      return existingUser;
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Create new user
    const user = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true,
    });

    console.log(`✓ Created user: ${userData.email} (${user.uid})`);
    return user;
  } catch (error) {
    console.error(`✗ Failed to create user ${userData.email}:`, error.message);
    throw error;
  }
}

async function createNotes(userId, userEmail, notes) {
  try {
    let createdCount = 0;

    for (const noteData of notes) {
      await db.collection("notes").add({
        title: noteData.title,
        content: noteData.content,
        userId: userId,
        sharedWith: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      createdCount++;
    }

    console.log(`✓ Created ${createdCount} notes for ${userEmail}`);
  } catch (error) {
    console.error(`✗ Failed to create notes for ${userEmail}:`, error.message);
    throw error;
  }
}

async function createSharedNote(ownerUid, sharedWithUid) {
  try {
    await db.collection("notes").add({
      title: "Shared Project Plan",
      content:
        "This note demonstrates the sharing feature. When shared, it triggers a Cloud Function that creates an activity log.",
      userId: ownerUid,
      sharedWith: [sharedWithUid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✓ Created shared note (demonstrates Cloud Function trigger)");
  } catch (error) {
    console.error("✗ Failed to create shared note:", error.message);
    throw error;
  }
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌱 TeamNotes Seed Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  try {
    // Create users and their notes
    const userRecords = {};

    for (const userData of TEST_USERS) {
      const user = await createUser(userData);
      userRecords[userData.email] = user;

      // Create sample notes
      const notes = SAMPLE_NOTES[userData.email] || [];
      if (notes.length > 0) {
        await createNotes(user.uid, userData.email, notes);
      }
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Create a shared note to demonstrate Cloud Function trigger
    if (userRecords["alice@example.com"] && userRecords["bob@example.com"]) {
      await createSharedNote(
        userRecords["alice@example.com"].uid,
        userRecords["bob@example.com"].uid
      );
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Seeding completed successfully!");
    console.log("");
    console.log("Test Credentials:");
    TEST_USERS.forEach((user) => {
      console.log(`  • ${user.email} / ${user.password}`);
    });
    console.log("");
    console.log("Next steps:");
    console.log("  1. Open http://localhost:5173 in your browser");
    console.log("  2. Sign in with any of the test accounts");
    console.log("  3. View the Emulator UI at http://localhost:4000");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Seeding failed:", error.message);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("");
    console.error("Make sure:");
    console.error("  1. Firebase emulator is running (npm run dev)");
    console.error("  2. Firestore emulator is accessible on localhost:8080");
    console.error("  3. Auth emulator is accessible on localhost:9099");
    console.error("");
    process.exit(1);
  }
}

// Run the script
main();
