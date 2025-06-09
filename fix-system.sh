#!/bin/bash

echo "🔥 AGENTS OS SYSTEM FIX - Permanent Solution"
echo "=============================================="

# 1. Kill all Node.js processes
echo "1️⃣ Killing all Node.js processes..."
pkill -f "node" 2>/dev/null || true
sleep 2

# 2. Remove corrupted build artifacts
echo "2️⃣ Removing corrupted build artifacts..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .turbo 2>/dev/null || true

# 3. Clear npm cache
echo "3️⃣ Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# 4. Verify environment variables
echo "4️⃣ Checking environment configuration..."
if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo "✅ ANON_KEY found"
else
    echo "❌ MISSING: NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "🔧 You need to add this to .env.local:"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Y2h5eXhzaXBkb3B3cHdueGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDA3OTcsImV4cCI6MjA2NDcxNjc5N30.ZgKbYVD1vT_EnkKKyM5Tm0b8FPPFo3A3J6mCnTrWEyk"
fi

# 5. Clean restart
echo "5️⃣ Starting clean development server..."
echo "🚀 Run: npm run dev"
echo ""
echo "✅ System cleanup complete!"
echo "📋 Next steps:"
echo "   1. Add the ANON_KEY to .env.local (if missing)"
echo "   2. Run 'npm run dev'"
echo "   3. Authentication should now work!" 