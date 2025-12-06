# How to Build iOS App for UTS Mobile App

## Prerequisites
- **Apple Developer Account** ($99/year) - Required for device testing and App Store distribution
- EAS CLI installed (✅ Already installed)
- Expo account logged in
- iOS bundle identifier configured

## Step-by-Step Instructions

### 1. Login to Expo (if not already logged in)
```bash
cd /Users/abhipatel/Desktop/UTS/uts-mobile-app
eas login
```

### 2. Configure Apple Developer Credentials

EAS Build needs your Apple Developer account to generate certificates and provisioning profiles. You have two options:

#### Option A: Interactive Setup (Recommended - First Time)
Run the build command interactively in your terminal:
```bash
eas build --platform ios --profile preview
```

When prompted:
1. **"Do you want to log in to your Apple account?"** → Type `yes` and press Enter
2. Enter your **Apple ID email** (e.g., your Apple Developer account email)
3. Enter your **Apple ID password**
4. If you have 2FA enabled, you'll need to provide the verification code

EAS will automatically:
- Generate certificates
- Create provisioning profiles
- Set up your app for distribution

#### Option B: Manual Credential Setup
If you prefer to set up credentials separately:
```bash
eas credentials
```
Then select iOS and follow the prompts.

### 3. Build for Internal Testing (Preview)
This creates an IPA file for testing on iOS devices:
```bash
eas build --platform ios --profile preview
```

**What this does:**
- Uses the `preview` profile from `eas.json`
- Creates an IPA file for internal testing
- Builds on Expo's cloud servers
- Takes about 15-25 minutes
- You'll get a download link when complete

### 4. Build for TestFlight (Beta Testing)
To distribute via TestFlight:
```bash
eas build --platform ios --profile production
```

**Then submit to TestFlight:**
```bash
eas submit --platform ios
```

### 5. Build for App Store (Production Release)
For App Store submission:
```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

### 6. Download and Install the IPA

After the build completes:

#### For Internal Testing:
1. You'll get a URL in the terminal
2. Visit: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds
3. Download the `.ipa` file
4. Install on iOS device using:
   - **TestFlight** (if submitted)
   - **Xcode** → Devices & Simulators → Drag and drop IPA
   - **Apple Configurator 2**
   - **Ad Hoc distribution** (if configured)

## Important Notes

### Bundle Identifier
Your iOS app uses bundle identifier: `com.utahtech.utsmobileapp`

Make sure this matches:
- Your Apple Developer account
- App Store Connect (if submitting to App Store)
- Xcode project settings

### Version Numbering
- **Version** (CFBundleShortVersionString): Set in `app.json` → `expo.version` (currently: "1.0.1")
- **Build Number** (CFBundleVersion): Auto-incremented by EAS Build

### Apple Developer Account Requirements
- **Free Apple ID**: Can only build for iOS Simulator (not real devices)
- **Paid Developer Account** ($99/year): Required for:
  - Installing on physical devices
  - TestFlight distribution
  - App Store submission

## Build Profiles Explained

- **preview**: IPA for internal testing (Ad Hoc distribution)
- **production**: IPA for TestFlight/App Store
- **development**: Development build with dev client

## Troubleshooting

### If build fails due to credentials:
1. Check your Apple Developer account status
2. Ensure bundle identifier is available
3. Run `eas credentials` to reconfigure

### If you see certificate errors:
```bash
eas credentials --platform ios
# Select "Set up production credentials" or "Set up preview credentials"
```

### To see build status:
```bash
eas build:list --platform ios
```

### To cancel a build:
```bash
eas build:cancel [build-id]
```

### Check bundle identifier mismatch:
The native iOS project might have a different bundle ID. Check:
- `ios/utsmobileapp.xcodeproj/project.pbxproj` → PRODUCT_BUNDLE_IDENTIFIER
- Should match `app.json` → `expo.ios.bundleIdentifier`

## Next Steps After IPA is Ready

1. **Test the IPA** on real iOS devices
2. **Submit to TestFlight** for beta testing (if using production profile)
3. **Submit to App Store** for public release
4. **Distribute** via Enterprise/Ad Hoc distribution (if configured)

## Quick Reference

```bash
# Internal testing build
eas build --platform ios --profile preview

# Production/TestFlight build
eas build --platform ios --profile production

# Submit to App Store/TestFlight
eas submit --platform ios

# View builds
eas build:list --platform ios

# Manage credentials
eas credentials --platform ios
```

## Build Links
- View all builds: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds
- Expo Dashboard: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app

