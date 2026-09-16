# The demo's emulator IS the published docker-firebase-emulator image.
#
# https://github.com/thoughtgears/docker-firebase-emulator
#
# Nothing about the emulator itself is reimplemented here: the base image
# supplies Node 24 (alpine), the JRE the Firestore emulator needs,
# firebase-tools, the nginx proxy and the /usr/bin/serve.sh entrypoint.
# This Dockerfile only drops this demo's Firebase project into the place
# that entrypoint expects (/srv/firebase) — so if a new version of the
# image breaks its own contract, `docker compose up` here fails and we
# find out before anyone else does.
#
# Pinned deliberately: the image publishes a version tag and `main`, but
# no `latest`. Bump this line (and the README table) to move versions.
FROM ghcr.io/thoughtgears/docker-firebase-emulator:15.30.1

WORKDIR /srv/firebase

# Firebase project config. serve.sh runs `firebase emulators:start` with
# /srv/firebase as its working directory, so firebase.json has to land here.
COPY firebase.json .firebaserc firestore.rules firestore.indexes.json ./

# Cloud Functions dependencies, installed at BUILD time from a committed
# lockfile. serve.sh will also `npm install --prefix /srv/firebase/functions`
# on start -- that is the image's own contract and it stays a no-op here.
#
# Installing at build time, into the image rather than into a mounted
# volume, is what makes the fresh-install path safe: there is no
# node_modules volume for docker-compose to create empty ahead of the
# entrypoint, so there is no state in which the Functions emulator can
# come up without firebase-functions on disk.
COPY functions/package.json functions/package-lock.json ./functions/
RUN npm ci --prefix ./functions

# Function source. .dockerignore keeps any host-side node_modules out.
COPY functions ./functions

# Entrypoint is inherited from the base image: /usr/bin/serve.sh.
