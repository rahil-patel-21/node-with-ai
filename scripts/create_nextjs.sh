#!/bin/bash

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <target-path> <project-name>"
    echo "Example: $0 /home/user/projects my-next-app"
    exit 1
fi

TARGET_PATH=$1
PROJECT_NAME=$2
FULL_PATH="${TARGET_PATH%/}/$PROJECT_NAME"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install it."
    exit 1
fi

mkdir -p "$TARGET_PATH"

echo "🚀 Creating Next.js project at $FULL_PATH"
yes | npx create-next-app@latest "$FULL_PATH" \
  --typescript \
  --app \
  --eslint \
  --tailwind \
  --src-dir \
  --no-interactive

cd "$FULL_PATH"

echo "📦 Installing dependencies..."
npm install

echo "🧪 Starting development server..."
NEXT_TELEMETRY_DISABLED=1 NEXT_PRIVATE_TURBOPACK=1 npm run dev

