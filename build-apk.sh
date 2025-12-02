#!/bin/bash

# Build APK for UTS Mobile App
# This script will build and publish the APK

cd "$(dirname "$0")"

echo "🚀 Starting APK build for UTS Mobile App..."
echo "📱 Version: 1.0.1 (Version Code: 2)"
echo ""

# Build the APK
# The first time, it will ask to generate a keystore - type 'y' and press Enter
eas build --platform android --profile preview

echo ""
echo "✅ Build process completed!"
echo "📥 Check the URL above to download your APK"
echo "🌐 Or visit: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds"

