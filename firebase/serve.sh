#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate required environment variables
if [ -z "$FIREBASE_PROJECT" ]; then
  log_error "FIREBASE_PROJECT environment variable is required"
  exit 1
fi

log_info "Starting Firebase Emulator for project: $FIREBASE_PROJECT"

# Install function dependencies if not already installed. Check for the
# actual firebase-functions package rather than just the node_modules
# directory: docker-compose.yml mounts node_modules as a named volume, and
# Docker creates that directory empty before this script ever runs, so a
# plain `-d` check always saw it as "already installed" on a brand new
# volume and the Functions emulator silently ran with no dependencies.
if [ ! -d "/firebase/functions/node_modules/firebase-functions" ]; then
  log_info "Installing function dependencies..."
  cd /firebase/functions
  npm install
  cd /firebase
else
  log_info "Function dependencies already installed"
fi

# Prepare emulator start command
EMULATOR_CMD="firebase emulators:start --project $FIREBASE_PROJECT"

# Add data import/export if DATA_DIRECTORY is set
if [ -n "$DATA_DIRECTORY" ]; then
  log_info "Data directory configured: $DATA_DIRECTORY"

  # Check if data directory has existing data to import
  if [ -f "$DATA_DIRECTORY/export/firebase-export-metadata.json" ]; then
    log_info "Found existing data, importing from ./$DATA_DIRECTORY/export..."
  else
    log_info "No existing data found, starting fresh (will export on exit)"
  fi

  # Always use both --import and --export-on-exit together
  # Firebase requires --import when using --export-on-exit without a path
  EMULATOR_CMD="$EMULATOR_CMD --import=./$DATA_DIRECTORY/export --export-on-exit"
fi

# Handle graceful shutdown
cleanup() {
  log_warn "Received shutdown signal, stopping emulators..."

  # Try graceful shutdown first
  if [ -n "$EMULATOR_PID" ]; then
    kill -SIGTERM "$EMULATOR_PID" 2>/dev/null || true

    # Wait up to 30 seconds for graceful shutdown
    for i in {1..30}; do
      if ! kill -0 "$EMULATOR_PID" 2>/dev/null; then
        log_info "Emulators stopped gracefully"
        exit 0
      fi
      sleep 1
    done

    # Force kill if still running
    log_warn "Forcing emulator shutdown..."
    kill -SIGKILL "$EMULATOR_PID" 2>/dev/null || true
  fi

  exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

# Start emulators
log_info "Executing: $EMULATOR_CMD"
$EMULATOR_CMD &
EMULATOR_PID=$!

# Wait for emulator process
wait $EMULATOR_PID
