#!/bin/sh
set -eu

retries=60
while [ "$retries" -gt 0 ]; do
  if mongosh "mongodb://mongo:27017/admin?directConnection=true" --quiet --eval 'db.adminCommand({ ping: 1 }).ok' | grep -q 1; then
    exec mongosh "mongodb://mongo:27017/admin?directConnection=true" --quiet /docker/mongo-init.js
  fi

  retries=$((retries - 1))
  sleep 1
done

echo 'Mongo did not answer ping before replica set init' >&2
exit 1
