#!/bin/bash
set -e

# Self-healing upfront check: if a previous build was killed abnormally, restore app/api
if [ -d ".app_api_tmp" ] && [ ! -d "app/api" ]; then
  echo "Found leftover .app_api_tmp from previous run, auto-restoring app/api..."
  mv .app_api_tmp app/api
fi

# Ensure cleanup happens even if the script exits with an error or interrupt signal
function cleanup {
  if [ -d ".app_api_tmp" ]; then
    echo "Restoring app/api directory..."
    mv .app_api_tmp app/api || true
  fi
}
trap cleanup EXIT INT TERM HUP

echo "Preparing static data..."
mkdir -p public/data
cp -r data/*.json public/data/

if [ -d "app/api" ]; then
  echo "Temporarily hiding API routes for static export..."
  mv app/api .app_api_tmp
fi

echo "Running Next.js static build..."
export STATIC_EXPORT=true
export NEXT_PUBLIC_STATIC_EXPORT=true
npm run build
