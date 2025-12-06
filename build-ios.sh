#!/bin/bash

# Build iOS App for UTS Mobile App
# This script will help you set up Apple credentials and build the iOS app

cd "$(dirname "$0")"

echo "🍎 Starting iOS build for UTS Mobile App..."
echo "📱 Version: 1.0.1 (Version Code: 2)"
echo ""
echo "📋 Apple Developer Account Info:"
echo "   Email: Jagpreet.A@utahtechnicalservicesllc.com"
echo ""
echo "⚠️  Important: You'll need to enter your Apple ID password when prompted."
echo "   If you have 2FA enabled, you'll also need a verification code."
echo ""
echo "Starting build process..."
echo ""

# Build the iOS app
# This will prompt for:
# 1. Apple account login (yes/no) - type: yes
# 2. Apple ID email - will use: Jagpreet.A@utahtechnicalservicesllc.com
# 3. Apple ID password - you'll need to enter: JSa!*19841985
# 4. 2FA code (if enabled) - check your devices
eas build --platform ios --profile preview

echo ""
echo "✅ Build process completed!"
echo "📥 Check the URL above to download your IPA"
echo "🌐 Or visit: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds"

