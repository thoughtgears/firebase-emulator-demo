FROM node:24-alpine

RUN apk add --no-cache curl

WORKDIR /app

# Install the pinned firebase-admin version at BUILD time, from this
# directory's own package.json. This is deliberately not the repo root's
# package.json: the previous setup bind-mounted that file read-write into
# the container and ran an unpinned `npm install firebase-admin` on every
# `docker compose up`, which silently rewrote the user's root package.json
# (and would rewrite a lockfile, if one existed) to whatever npm resolved
# that day. Baking the dependency into the image instead makes running the
# demo a read-only operation with respect to the repo working tree.
COPY package.json ./
RUN npm install --omit=dev

COPY seed-data.js entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
