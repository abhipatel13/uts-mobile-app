# UTS Mobile App

A React Native mobile application for proximity detection and safety management using Bluetooth Low Energy (BLE) and geolocation.

## Features

- **Bluetooth Low Energy (BLE)** proximity detection
- **Background geolocation** tracking and geofencing
- **Offline-first architecture** with sync capabilities
- **Real-time notifications** for proximity alerts
- **Privacy-focused** with rotating BLE identifiers
- **Cross-platform** iOS and Android support

## Tech Stack

- **Framework**: React Native with TypeScript
- **Workflow**: Expo Bare
- **State Management**: Zustand with persistence
- **Navigation**: React Navigation
- **BLE**: react-native-ble-plx
- **Location**: react-native-background-geolocation
- **Storage**: AsyncStorage + SQLite
- **Notifications**: Notifee

## Prerequisites

- Node.js 18+
- React Native development environment
- iOS: Xcode 12+ and iOS 11+
- Android: Android Studio and API level 21+

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uts-mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies (iOS only):
```bash
cd ios && pod install && cd ..
```

## Development

### Start the development server:
```bash
npm start
```

### Run on iOS:
```bash
npm run ios
```

### Run on Android:
```bash
npm run android
```

### Type checking:
```bash
npm run type-check
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # Business logic and API services
├── store/          # Zustand store configuration
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── constants/      # App constants and configuration
```

## Key Services

### BLEService
Handles Bluetooth Low Energy operations:
- Device scanning and advertising
- Proximity detection with RSSI
- Encounter recording

### LocationService (TODO)
Manages location tracking:
- Background location updates
- Geofencing
- Location breadcrumbs

### SyncService (TODO)
Handles offline/online synchronization:
- Queue management
- Batch uploads
- Retry logic

## Permissions

The app requires the following permissions:

### iOS
- Bluetooth (NSBluetoothAlwaysUsageDescription)
- Location (NSLocationAlwaysAndWhenInUseUsageDescription)
- Background modes (bluetooth-central, bluetooth-peripheral, location)

### Android
- BLUETOOTH_SCAN
- BLUETOOTH_ADVERTISE
- BLUETOOTH_CONNECT
- ACCESS_FINE_LOCATION
- ACCESS_BACKGROUND_LOCATION

## Configuration

Update the backend URL in `src/constants/index.ts`:
```typescript
export const API_ENDPOINTS = {
  BASE_URL: 'https://your-backend-url.com',
  // ...
};
```

## Building for Production

### Android:
```bash
npm run build:android
```

### iOS:
```bash
npm run build:ios
```

## Privacy & Security

- BLE identifiers rotate periodically for privacy
- Location data is anonymized
- All sensitive data is encrypted in storage
- Minimal data collection with user consent

## License

Private - Utah Tech Services LLC

## Support

For technical support, contact the development team.
