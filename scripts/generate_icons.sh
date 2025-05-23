#!/usr/bin/bash

set -e

# Change to the parent directory
cd "${0%/*}/.."

convert -background none favicon.svg -resize 512x512 ./public/favicon-512x512.png
convert -background none favicon.svg -resize 192x192 ./public/favicon-192x192.png
convert -background none favicon.svg -resize 64x64 ./public/favicon.png
