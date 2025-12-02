# How to Build APK for UTS Mobile App

## Prerequisites
- EAS CLI installed (✅ Already installed)
- Expo account logged in
- Android package configured in `app.json`

## Step-by-Step Instructions

### 1. Login to Expo (if not already logged in)
```bash
cd /Users/abhipatel/Desktop/UTS/uts-mobile-app
eas login
```

### 2. Build APK for Preview/Testing
This will generate an APK file (not AAB) that you can install directly:

```bash
eas build --platform android --profile preview
```

**What this does:**
- Uses the `preview` profile from `eas.json` which is configured for APK
- Builds on Expo's cloud servers
- Takes about 10-20 minutes
- You'll get a download link when complete

### 3. Build APK for Production
If you want a production APK (for distribution outside Play Store):

```bash
eas build --platform android --profile production --type apk
```

**Note:** Your `production` profile is set to `app-bundle` (AAB). To generate APK, you can either:
- Use the command above with `--type apk` flag, OR
- Update `eas.json` to add an APK production profile

### 4. Download the APK
After the build completes:
1. You'll get a URL in the terminal
2. Or visit: https://expo.dev/accounts/abhipatel8675/projects/uts-mobile-app/builds
3. Download the `.apk` file
4. Install on Android device

## Alternative: Local Build (Faster, but requires Android Studio)

If you want to build locally:

```bash
# Make sure you have Android Studio installed
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Update app.json Before Building

Make sure these are set correctly in `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.utahtech.utsmobileapp",
      "versionCode": 1  // Increment this for each new build
    }
  }
}
```

## Build Profiles Explained

- **preview**: APK for testing (internal distribution)
- **production**: AAB for Play Store (or APK with --type flag)
- **development**: Development build with dev client

## Troubleshooting

### If build fails:
1. Check `app.json` configuration
2. Ensure all dependencies are in `package.json`
3. Check Expo status: https://status.expo.dev

### To see build status:
```bash
eas build:list
```

### To cancel a build:
```bash
eas build:cancel [build-id]
```

## Next Steps After APK is Ready

1. **Test the APK** on a real Android device
2. **Sign the APK** (if needed for distribution)
3. **Distribute** via:
   - Direct download link
   - Internal testing
   - Google Play Store (requires AAB, not APK)

