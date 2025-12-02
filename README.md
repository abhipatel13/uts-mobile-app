# UTS Mobile App

React Native mobile application for Utah Tech Services (UTS) - enabling field workers to manage risk assessments, task hazards, and safety operations on the go.

## 🚀 Tech Stack

- **Framework**: React Native 0.81.4
- **Platform**: Expo ~54.0.10
- **Language**: JavaScript
- **Navigation**: React Navigation 6.x
- **Storage**: AsyncStorage, Expo SQLite
- **Maps**: React Native Maps 1.20.1
- **Location**: Expo Location ~19.0.7
- **Network**: @react-native-community/netinfo

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- **For iOS Development**:
  - macOS
  - Xcode 14+
  - CocoaPods
- **For Android Development**:
  - Android Studio
  - Android SDK
  - Java Development Kit (JDK)

## 🔧 Installation

1. **Navigate to the project directory**
   ```bash
   cd uts-mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies (macOS only)**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file (if needed):
   ```env
   API_URL=http://localhost:3000/api
   # Production: API_URL=https://18.188.112.65.nip.io/api
   ```

## 🏃 Running the Application

### Start Expo Development Server
```bash
npm start
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Display a QR code for testing

### Run on iOS Simulator (macOS only)
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

### Run on Web (for testing)
```bash
npm run web
```

### Run on Physical Device

1. Install **Expo Go** app on your device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code displayed in terminal/browser
3. App will load on your device

## 📁 Project Structure

```
uts-mobile-app/
├── src/
│   ├── screens/              # Screen components
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── RiskAssessmentScreen.js
│   │   └── ...
│   ├── components/           # Reusable components
│   │   ├── Button.js
│   │   ├── Input.js
│   │   └── ...
│   ├── services/              # API services
│   │   ├── api.js            # API configuration
│   │   ├── auth.service.js   # Authentication
│   │   ├── risk.service.js   # Risk assessments
│   │   └── ...
│   ├── utils/                 # Utility functions
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Library configurations
├── android/                   # Android native code
├── ios/                       # iOS native code
├── assets/                    # Images, fonts, etc.
├── App.js                     # Root component
├── app.json                   # Expo configuration
└── package.json
```

## 🎨 Features

### Authentication
- User login
- Secure token storage
- Auto-logout on token expiry
- Biometric authentication (if configured)

### Risk Assessments
- Create risk assessments in the field
- View existing assessments
- Offline capability with local storage
- Sync when online
- Photo attachments
- GPS location tagging

### Task Hazards
- Create and manage task hazards
- Hazard identification
- Risk evaluation
- Status updates
- Offline support

### Asset Management
- View asset hierarchy
- Search assets
- Asset details
- Location-based asset discovery

### Maps Integration
- Interactive maps
- Asset location visualization
- GPS tracking
- Route planning

### Offline Support
- Local SQLite database
- Offline data entry
- Automatic sync when online
- Conflict resolution

### Notifications
- Push notifications
- In-app notifications
- Task reminders

## 🔐 Authentication

The app uses JWT tokens stored securely in AsyncStorage. Tokens are automatically included in API requests.

## 📡 API Integration

All API calls are handled through services in `src/services/`. The app connects to the same backend API as the web application.

Example:
```javascript
// services/auth.service.js
import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};
```

## 🗄️ Local Storage

The app uses:
- **AsyncStorage**: For user preferences and tokens
- **Expo SQLite**: For offline data storage and sync

## 📱 Platform-Specific Features

### iOS
- Native iOS navigation
- Push notifications via APNs
- Camera integration
- Location services

### Android
- Material Design components
- Android navigation
- Push notifications via FCM
- Camera integration
- Location services

## 🧪 Testing

### Development Testing
- Use Expo Go app for quick testing
- Hot reloading enabled
- Remote debugging available

### Production Build

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

## 🚀 Deployment

### Using EAS (Expo Application Services)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure project**
   ```bash
   eas build:configure
   ```

4. **Build for production**
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

5. **Submit to app stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

### Manual Build

#### iOS
1. Open `ios/utsmobileapp.xcworkspace` in Xcode
2. Configure signing & capabilities
3. Archive and upload to App Store

#### Android
1. Run `cd android && ./gradlew assembleRelease`
2. Sign the APK
3. Upload to Google Play Console

## 📦 Key Dependencies

### Core
- `expo` - Expo SDK
- `react-native` - React Native framework
- `react` - React library

### Navigation
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/drawer` - Drawer navigator

### Storage & Data
- `@react-native-async-storage/async-storage` - Key-value storage
- `expo-sqlite` - SQLite database

### Maps & Location
- `react-native-maps` - Maps component
- `expo-location` - Location services

### UI & Gestures
- `react-native-gesture-handler` - Gesture handling
- `react-native-reanimated` - Animations
- `react-native-safe-area-context` - Safe area handling

### Network
- `@react-native-community/netinfo` - Network status

## 🔒 Security

- Secure token storage
- HTTPS API communication
- Certificate pinning (if configured)
- Biometric authentication support
- Secure data encryption

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
```

### Network Connection Issues
- Verify API_URL is correct
- Check backend server is running
- Ensure device/emulator can reach backend
- Check CORS settings on backend

## 📱 Device Requirements

### iOS
- iOS 13.0 or later
- iPhone or iPad

### Android
- Android 6.0 (API level 23) or later
- ARM or x86 architecture

## 🎯 Development Workflow

1. Start development server: `npm start`
2. Open on device/emulator
3. Make code changes
4. See changes with hot reload
5. Test features
6. Build for production when ready

## 📄 Configuration Files

- `app.json` - Expo configuration
- `eas.json` - EAS build configuration
- `babel.config.js` - Babel configuration
- `metro.config.js` - Metro bundler configuration

## 📞 Support

For issues or questions:
1. Check Expo documentation: https://docs.expo.dev
2. Check React Native documentation: https://reactnative.dev
3. Contact the development team

## 📝 Notes

- The app requires an active internet connection for initial login
- Offline mode available for data entry
- Automatic sync when connection restored
- GPS features require location permissions

## 🔄 Updates

The app supports OTA (Over-The-Air) updates via Expo Updates:
```bash
eas update --branch production
```

This allows pushing updates without going through app stores for non-native changes.


