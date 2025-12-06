# Quick iOS Build Guide

## Your Apple Developer Account
- **Email**: Jagpreet.A@utahtechnicalservicesllc.com
- **Password**: JSa!*19841985

## Quick Start - Run This Command

```bash
cd /Users/abhipatel/Desktop/UTS/uts-mobile-app
eas build --platform ios --profile preview
```

## When Prompted, Enter:

1. **"Do you want to log in to your Apple account?"**
   - Type: `yes` and press Enter

2. **"Apple ID:"**
   - Type: `Jagpreet.A@utahtechnicalservicesllc.com` and press Enter

3. **"Password:"**
   - Type: `JSa!*19841985` and press Enter
   - Note: The password won't be visible as you type (this is normal for security)

4. **Two-Factor Authentication (if enabled):**
   - Check your iPhone, iPad, or Mac for a verification code
   - Enter the 6-digit code when prompted

5. **"Select an Apple Team" (if you have multiple teams):**
   - Select your team using arrow keys and press Enter

## Alternative: Use the Build Script

```bash
cd /Users/abhipatel/Desktop/UTS/uts-mobile-app
./build-ios.sh
```

Then follow the same prompts as above.

## What Happens Next

- EAS will automatically:
  - Generate iOS certificates
  - Create provisioning profiles
  - Build your app on Expo's servers
  - Take 15-25 minutes to complete

## After Build Completes

You'll get:
- A download link for the `.ipa` file
- A QR code to scan with your iPhone
- Build dashboard: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds

## Troubleshooting

### If you get "Invalid credentials":
- Double-check the email and password
- Make sure your Apple Developer account is active ($99/year subscription)

### If 2FA code doesn't work:
- Make sure you're checking the right device
- Codes expire quickly, request a new one if needed

### If "No team found":
- Make sure your Apple Developer account is active
- You may need to accept terms at https://developer.apple.com

