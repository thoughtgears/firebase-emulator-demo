#!/bin/sh
set -eu

echo "🌱 Checking if data needs to be seeded..."

# Give the Auth emulator a moment past the firebase-emulator container's own
# health check (which only confirms the Emulator UI on :4000 is up) before
# querying it directly.
sleep 5

PROJECT_ID="${FIREBASE_PROJECT_ID:-teamnotes-demo}"
AUTH_HOST="${FIREBASE_AUTH_EMULATOR_HOST:-firebase-emulator:9099}"

AUTH_USERS=$(curl -s "http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts" | grep -o '"users":\[' | wc -l)

if [ "$AUTH_USERS" -eq 0 ]; then
  echo "📝 No users found, seeding data..."
  node seed-data.js
  echo "✅ Data seeded successfully!"
else
  echo "✓ Data already exists, skipping seed."
fi
