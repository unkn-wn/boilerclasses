#!/bin/sh
# Download the harmonized data snapshot pinned in data.lock to server/classes_out.json
# and verify its hash. Used by the Dockerfile and for local dev.
set -e
cd "$(dirname "$0")"

SHA=$(cat ../data.lock)
curl -fsSL "https://boilerclasses.s3.amazonaws.com/snapshots/${SHA}.json" -o classes_out.json

if command -v sha256sum >/dev/null; then
  echo "${SHA}  classes_out.json" | sha256sum -c -
else
  echo "${SHA}  classes_out.json" | shasum -a 256 -c -
fi
