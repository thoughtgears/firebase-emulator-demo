FROM node:22-alpine

# Install Java (required for Firestore emulator)
RUN apk add --no-cache openjdk21-jre bash curl

# Install Firebase CLI globally
RUN npm install -g firebase-tools@13.23.1

# Set working directory
WORKDIR /firebase

# Copy Firebase configuration files
COPY firebase.json .firebaserc firestore.rules firestore.indexes.json ./

# Copy functions directory
COPY functions ./functions

# Copy startup script
COPY serve.sh ./serve.sh
RUN chmod +x ./serve.sh

# Create data directory structure for persistence
RUN mkdir -p /firebase/data/export

# Expose emulator ports
EXPOSE 4000 4400 5001 5002 8080 9099

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:4000 || exit 1

# Start Firebase emulator
CMD ["./serve.sh"]
