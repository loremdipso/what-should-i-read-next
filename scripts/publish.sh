#!/usr/bin/bash

set -e

# Change to the parent directory
cd "${0%/*}/.."

npm run build
git add -A
git commit -m "Publishing"
git push
