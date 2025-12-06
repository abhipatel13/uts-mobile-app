#!/bin/bash

# Rebuild APK with fixed package name
cd "$(dirname "$0")"

echo "🔧 Fixed Issues:"
echo "  ✅ Package name: com.utahtech.utsmobileapp (was mismatched)"
echo "  ✅ Version: 1.0.1 (Version Code: 2)"
echo "  ✅ All changes committed and pushed"
echo ""
echo "🚀 Starting new build..."
echo ""

# Build the APK
eas build --platform android --profile preview

echo ""
echo "✅ Build submitted!"
echo "📊 Check status: eas build:list"
echo "🌐 Or visit: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds"


