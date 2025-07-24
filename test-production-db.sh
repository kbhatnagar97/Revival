#!/bin/bash

# 🚀 Production Database Testing Script
# Test your frontend against production Firebase services

echo "🚀 Setting up Production Database Testing..."
echo ""

# Check if we want to use production DB
if [ "$1" = "local" ]; then
    echo "🧪 Switching back to LOCAL emulators..."
    # Remove the production flag
    if [ -f "packages/frontend/.env.production.local" ]; then
        sed -i '' 's/VITE_USE_PRODUCTION_DB=true/VITE_USE_PRODUCTION_DB=false/' packages/frontend/.env.production.local
    fi
    echo "✅ Now using LOCAL Firebase emulators"
    echo "   Make sure your emulators are running!"
else
    echo "🚀 Switching to PRODUCTION database..."
    # Set the production flag
    if [ -f "packages/frontend/.env.production.local" ]; then
        sed -i '' 's/VITE_USE_PRODUCTION_DB=false/VITE_USE_PRODUCTION_DB=true/' packages/frontend/.env.production.local
    else
        echo "VITE_USE_PRODUCTION_DB=true" > packages/frontend/.env.production.local
    fi
    echo "✅ Now using PRODUCTION Firebase services"
    echo "   ⚠️  You'll be working with REAL data!"
fi

echo ""
echo "🔧 Rebuilding frontend with new configuration..."
npm run build --workspace=packages/frontend

echo ""
echo "🌐 Starting production server..."
cd packages/frontend/dist
python3 -m http.server 3001 &
SERVER_PID=$!
cd ../../..

echo ""
echo "🎯 Production Database Testing Ready!"
echo ""
echo "📊 Your setup:"
if [ "$1" = "local" ]; then
    echo "   🧪 Database: LOCAL emulators"
    echo "   🔗 Frontend: http://localhost:3001"
    echo "   🔥 Firebase UI: http://127.0.0.1:4001"
else
    echo "   🚀 Database: PRODUCTION Firebase"
    echo "   🔗 Frontend: http://localhost:3001"
    echo "   🌐 Firebase Console: https://console.firebase.google.com/project/revival-e0aa5"
fi
echo ""
echo "🧪 Test your app at: http://localhost:3001"
echo ""
echo "⚠️  IMPORTANT:"
if [ "$1" = "local" ]; then
    echo "   - Using LOCAL data (safe to experiment)"
    echo "   - Make sure Firebase emulators are running"
else
    echo "   - Using PRODUCTION data (be careful!)"
    echo "   - Changes will affect real users"
    echo "   - Perfect for testing with real data"
fi
echo ""
echo "🛑 To stop server: kill $SERVER_PID"
echo "🔄 To switch modes: ./test-production-db.sh [local]"
