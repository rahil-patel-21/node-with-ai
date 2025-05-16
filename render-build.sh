#!/usr/bin/env bash
set -e

echo "🔧 Ensuring Chromium is downloaded for Puppeteer..."
npx puppeteer browsers install chrome

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build