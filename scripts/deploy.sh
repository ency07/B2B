#!/bin/bash
set -euo pipefail

echo "🚀 Pre-deploy validation..."

# Check env vars
required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Missing required env: $var"
    exit 1
  fi
done

echo "✅ Environment validated"

# Run pre-deploy checks
echo "📦 Running TypeScript check..."
npx tsc --noEmit

echo "📦 Running linter..."
npm run lint

echo "📦 Running tests..."
npx vitest run

echo "📦 Building..."
npm run build

echo ""
echo "✅ Build successful!"
echo ""
echo "To deploy:"
echo "  Vercel:  vercel --prod"
echo "  Docker:  docker build -t myapp . && docker run -p 3000:3000 myapp"
